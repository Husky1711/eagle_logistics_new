"""Live auth QA against running API (127.0.0.1:8000)."""
import httpx

API = "http://127.0.0.1:8000/api"
ADMIN_ORIGIN = "http://localhost:5174"
issues = []
passed = []


def fail(msg):
    issues.append(msg)
    print(f"  FAIL: {msg}")


def ok(msg):
    passed.append(msg)
    print(f"  OK: {msg}")


def main():
    print("\n=== Live Auth QA ===\n")

    with httpx.Client(base_url=API, timeout=10.0) as client:
        # 1. Me without cookie
        r = client.get("/auth/me")
        if r.status_code != 401:
            fail(f"/me without session expected 401, got {r.status_code}")
        else:
            ok("/me without session -> 401")

        # 2. Login
        r = client.post(
            "/auth/login",
            json={"username": "admin", "password": "change-me-in-production"},
        )
        if r.status_code != 200:
            fail(f"login failed: {r.status_code} {r.text}")
        else:
            ok("login -> 200")

        set_cookie = r.headers.get("set-cookie", "")
        if "httponly" not in set_cookie.lower():
            fail(f"session cookie missing HttpOnly flag: {set_cookie[:80]}")
        else:
            ok("session cookie has HttpOnly")

        if "samesite=lax" not in set_cookie.lower():
            fail(f"session cookie missing SameSite=Lax: {set_cookie[:80]}")
        else:
            ok("session cookie has SameSite=Lax")

        # 3. Me with cookie (same client)
        r = client.get("/auth/me")
        if r.status_code != 200 or r.json().get("username") != "admin":
            fail(f"/me after login failed: {r.status_code} {r.text}")
        else:
            ok("/me after login -> admin")

        # 4. Logout
        r = client.post("/auth/logout")
        if r.status_code != 200:
            fail(f"logout failed: {r.status_code}")
        else:
            ok("logout -> 200")

        r = client.get("/auth/me")
        if r.status_code != 401:
            fail(f"/me after logout expected 401, got {r.status_code}")
        else:
            ok("/me after logout -> 401")

        # 5. Logout twice
        r = client.post("/auth/logout")
        if r.status_code != 401:
            fail(f"double logout expected 401, got {r.status_code}")
        else:
            ok("logout without session -> 401")

    # 6. CORS preflight from admin origin
    with httpx.Client(timeout=10.0) as client:
        r = client.options(
            f"{API}/auth/login",
            headers={
                "Origin": ADMIN_ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        acao = r.headers.get("access-control-allow-origin")
        acac = r.headers.get("access-control-allow-credentials")
        if acao != ADMIN_ORIGIN:
            fail(f"CORS preflight ACAO={acao!r}, expected {ADMIN_ORIGIN}")
        else:
            ok("CORS preflight allows admin origin")
        if acac != "true":
            fail(f"CORS credentials not allowed: {acac!r}")
        else:
            ok("CORS allows credentials")

    # 7. Cross-origin login with credentials (simulates browser)
    with httpx.Client(base_url=API, timeout=10.0) as client:
        r = client.post(
            "/auth/login",
            json={"username": "admin", "password": "change-me-in-production"},
            headers={"Origin": ADMIN_ORIGIN},
        )
        if r.status_code != 200:
            fail(f"cross-origin login failed: {r.status_code}")
        else:
            ok("cross-origin login with Origin header -> 200")

        r = client.get("/auth/me", headers={"Origin": ADMIN_ORIGIN})
        if r.status_code != 200:
            fail(f"cross-origin /me failed: {r.status_code} — cookie may not persist")
        else:
            ok("cross-origin /me with session -> 200")

    # 8. Wrong origin should not get ACAO echo (security)
    with httpx.Client(timeout=10.0) as client:
        r = client.post(
            f"{API}/auth/login",
            json={"username": "admin", "password": "change-me-in-production"},
            headers={"Origin": "http://evil.example.com"},
        )
        acao = r.headers.get("access-control-allow-origin")
        if acao == "http://evil.example.com":
            fail("CORS reflects evil origin on login")
        else:
            ok("CORS does not allow evil origin")

    # 9. 127.0.0.1 admin origin — common dev mismatch
    with httpx.Client(base_url=API, timeout=10.0) as client:
        r = client.post(
            "/auth/login",
            json={"username": "admin", "password": "change-me-in-production"},
            headers={"Origin": "http://127.0.0.1:5174"},
        )
        acao = r.headers.get("access-control-allow-origin")
        if acao == "http://127.0.0.1:5174":
            ok("127.0.0.1:5174 allowed by CORS")
        else:
            fail(
                "127.0.0.1:5174 blocked by CORS (admin opened via IP will fail login in browser)"
            )

    # 10. Vite fallback port when 5174 is busy
    with httpx.Client(base_url=API, timeout=10.0) as client:
        r = client.post(
            "/auth/login",
            json={"username": "admin", "password": "change-me-in-production"},
            headers={"Origin": "http://localhost:5175"},
        )
        acao = r.headers.get("access-control-allow-origin")
        if acao == "http://localhost:5175":
            ok("localhost:5175 allowed by CORS (Vite fallback port)")
        else:
            fail("localhost:5175 blocked by CORS (admin on fallback port will fail login)")

    print(f"\n=== Summary: {len(passed)} passed, {len(issues)} failed ===")
    if issues:
        for item in issues:
            print(f" - {item}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
