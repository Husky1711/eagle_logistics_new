export default function InsecureBanner() {
  return (
    <div role="alert" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      ⚠️ This connection is not secure (no HTTPS). Don&apos;t use the admin on the live site until SSL is installed.
    </div>
  )
}
