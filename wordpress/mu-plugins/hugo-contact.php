<?php
/**
 * Plugin Name: Hugo — Endpoint de contact
 * Description: Route REST publique pour le formulaire de contact du front Astro.
 *              Envoie un email à l'adresse configurée.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Adresse de réception des messages.
// ⚠️ Copie versionnée (dépôt public) : email volontairement masqué.
//     La vraie adresse est définie dans la copie ACTIVE côté WordPress.
define('HUGO_CONTACT_TO', 'REMPLACER_PAR_TON_EMAIL@exemple.com');

add_action('rest_api_init', function () {
    register_rest_route('hugo/v1', '/contact', [
        'methods'             => 'POST',
        'callback'            => 'hugo_handle_contact',
        'permission_callback' => '__return_true',
    ]);
});

function hugo_handle_contact(WP_REST_Request $request) {
    // Le front est sur un autre domaine (Astro) : on autorise l'appel cross-origin.
    // Requête "simple" (form-urlencoded) => pas de préflight à gérer.
    header('Access-Control-Allow-Origin: *');

    // Anti-spam : champ piège "website". S'il est rempli, on ignore (en simulant un succès).
    if (!empty($request->get_param('website'))) {
        return new WP_REST_Response(['ok' => true], 200);
    }

    $name    = sanitize_text_field((string) $request->get_param('name'));
    $email   = sanitize_email((string) $request->get_param('email'));
    $message = trim((string) $request->get_param('message'));

    if ($name === '' || $message === '' || !is_email($email)) {
        return new WP_REST_Response(
            ['ok' => false, 'error' => 'Merci de vérifier les champs du formulaire.'],
            400
        );
    }

    $subject = sprintf('Nouveau message depuis le site — %s', $name);
    $body    = sprintf(
        "Nom : %s\nEmail : %s\n\nMessage :\n%s\n",
        $name,
        $email,
        $message
    );
    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        sprintf('Reply-To: %s <%s>', $name, $email),
    ];

    $sent = wp_mail(HUGO_CONTACT_TO, $subject, $body, $headers);

    if (!$sent) {
        // En local (Local), l'envoi échoue souvent : aucun serveur mail configuré.
        // En production, prévoir un plugin SMTP (ex. WP Mail SMTP) pour une livraison fiable.
        return new WP_REST_Response(
            ['ok' => false, 'error' => "L'envoi de l'email a échoué côté serveur."],
            500
        );
    }

    return new WP_REST_Response(['ok' => true], 200);
}
