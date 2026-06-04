<?php

namespace App\Services\Tenancy;

use App\Mail\OnboardingInvitationMail;
use App\Models\Master\OnboardingInvitation;
use App\Models\Master\Tenant;
use App\Support\Tenancy\TenantUrl;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OnboardingInvitationMailer
{
    public function isConfigured(): bool
    {
        $mailer = (string) config('mail.default', 'log');

        if (in_array($mailer, ['log', 'array'], true)) {
            return false;
        }

        if ($mailer === 'smtp') {
            return (string) config('mail.mailers.smtp.host') !== ''
                && (string) config('mail.mailers.smtp.username') !== '';
        }

        return true;
    }

    /**
     * @return array{sent: bool, error: ?string}
     */
    public function send(Tenant $tenant, OnboardingInvitation $invitation, string $plainToken): array
    {
        if (! $this->isConfigured()) {
            return [
                'sent' => false,
                'error' => 'SMTP no configurado (MAIL_MAILER=log o faltan credenciales).',
            ];
        }

        $onboardingUrl = TenantUrl::onboarding($plainToken);
        $expiresFormatted = $invitation->expires_at instanceof Carbon
            ? $invitation->expires_at->timezone(config('app.timezone'))->format('d/m/Y H:i')
            : (string) $invitation->expires_at;

        try {
            Mail::to($invitation->email)->send(new OnboardingInvitationMail(
                onboardingUrl: $onboardingUrl,
                slug: $tenant->slug,
                subdomainHost: $tenant->slug.'.'.TenantUrl::baseDomain(),
                expiresAtFormatted: $expiresFormatted,
            ));

            return ['sent' => true, 'error' => null];
        } catch (\Throwable $e) {
            Log::error('Onboarding invitation email failed', [
                'tenant_id' => $tenant->id,
                'email' => $invitation->email,
                'message' => $e->getMessage(),
            ]);

            return [
                'sent' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
