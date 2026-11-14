<?php
/**
 * Contact-page feedback form -> email to the client's inbox.
 *
 * POST JSON { name, email, phone?, topic, message, website }
 *   "website" is a hidden honeypot field: real visitors leave it empty.
 * -> { ok }
 *
 * Recipient: config.php 'feedback_to'. Sent with PHP mail() through the
 * hosting server; Reply-To is the visitor, so the client can just hit Reply.
 */
require __DIR__ . '/_bootstrap.php';

require_method('POST');
$body = read_json_body();

// Bots fill every field - pretend success so they don't retry
if (trim((string) ($body['website'] ?? '')) !== '') {
    json_out(['ok' => true]);
}

$ip = client_ip();
if (count(rate_hits('feedback', $ip, 3600)) >= FEEDBACK_MAX_PER_HOUR) {
    fail('Too many messages - please try again later or WhatsApp us.', 429);
}

$topics = ['feedback' => 'General feedback', 'enquiry' => 'Shipping enquiry', 'complaint' => 'Complaint', 'other' => 'Other'];
$name = clean_text($body['name'] ?? '', 100);
$email = clean_text($body['email'] ?? '', 200);
$phone = clean_text($body['phone'] ?? '', 30);
$topicKey = clean_text($body['topic'] ?? 'feedback', 20);
$topic = $topics[$topicKey] ?? $topics['feedback'];
$message = clean_text($body['message'] ?? '', 5000);

$errors = [];
if ($name === '') {
    $errors['name'] = 'Please enter your name';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email';
}
if ($phone !== '' && !preg_match('/^[0-9+()\-\s]{6,30}$/', $phone)) {
    $errors['phone'] = 'Please enter a valid phone number';
}
if (strlen($message) < 10) {
    $errors['message'] = 'Please write a bit more detail';
}
if ($errors) {
    fail('Please check the form', 422, ['fields' => $errors]);
}

$config = load_config();
$to = $config['feedback_to'] ?? '';
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    fail('Feedback email is not set up yet - please WhatsApp us.', 503);
}
$from = filter_var($config['mail_from'] ?? '', FILTER_VALIDATE_EMAIL) ?: 'no-reply@eaglelogistics.in';

// Header-safe values (no line breaks can reach the mail headers)
$safeName = preg_replace('/[\r\n"<>]+/', ' ', $name);
$subject = '=?UTF-8?B?' . base64_encode("Website {$topic} from {$safeName}") . '?=';

$text = "New message from the Eagle Logistics website\n"
    . "--------------------------------------------\n"
    . "Name:    {$name}\n"
    . "Email:   {$email}\n"
    . ($phone !== '' ? "Phone:   {$phone}\n" : '')
    . "Topic:   {$topic}\n"
    . 'Sent:    ' . date('d M Y, h:i A') . " IST\n\n"
    . "Message:\n{$message}\n\n"
    . "--\nReply to this email to answer {$safeName} directly.\n";

$headers = implode("\r\n", [
    'From: Eagle Logistics Website <' . $from . '>',
    'Reply-To: ' . $safeName . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: EagleLogistics/1.0',
]);

rate_record('feedback', $ip, 3600);

if (getenv('EAGLE_MAIL_LOG')) {
    // Local testing: write the email to a file instead of sending it
    file_put_contents(getenv('EAGLE_MAIL_LOG'), "To: {$to}\n{$headers}\nSubject: {$subject}\n\n{$text}\n=====\n", FILE_APPEND);
    json_out(['ok' => true]);
}

if (!@mail($to, $subject, $text, $headers, '-f' . $from)) {
    fail('Could not send right now - please WhatsApp us instead.', 502);
}
json_out(['ok' => true]);
