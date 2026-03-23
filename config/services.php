<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'access_token'  => env('GOOGLE_ACCESS_TOKEN'),
        'refresh_token' => env('GOOGLE_REFRESH_TOKEN'),
        'pubsub_topic'  => env('GOOGLE_PUBSUB_TOPIC'),
        'reply_from_email' => env('GOOGLE_REPLY_FROM_EMAIL'),
        'reply_from_name'  => env('GOOGLE_REPLY_FROM_NAME', 'RMTY Architectural'),
        
    ],

    'meta' => [
        'app_id'            => env('META_APP_ID'),
        'app_secret'        => env('META_APP_SECRET'),
        'verify_token'      => env('META_VERIFY_TOKEN'),
        'page_access_token' => env('META_PAGE_ACCESS_TOKEN'),
],

'viber' => [
    'token'    => env('VIBER_TOKEN'),
    'bot_name' => env('VIBER_BOT_NAME', 'RMTY Architectural'),
],

];
