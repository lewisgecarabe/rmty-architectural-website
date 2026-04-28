<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Generates unique, human-readable reference IDs.
 *
 * Format:
 *   Consultation : APT-YYYYMMDD-XXXX
 *   Inquiry      : INQ-YYYYMMDD-XXXX
 *
 * The XXXX suffix is a zero-padded sequential counter that resets per prefix
 * per day, with a random fallback to handle the (unlikely) edge case where
 * two requests race at the exact same millisecond.
 */
class ReferenceIdService
{
    private const MAX_ATTEMPTS = 10;

    // ── Public entry-points ───────────────────────────────────────────────

    public static function forConsultation(): string
    {
        return static::generate('APT', 'consultations');
    }

    public static function forInquiry(): string
    {
        return static::generate('INQ', 'inquiries');
    }

    // ── Core generator ────────────────────────────────────────────────────

    private static function generate(string $prefix, string $table): string
    {
        $date = now()->format('Ymd');

        for ($attempt = 0; $attempt < static::MAX_ATTEMPTS; $attempt++) {
            $refId = static::buildId($prefix, $date, $table, $attempt);

            // Check uniqueness — DB-level unique constraint is the final guard,
            // but checking here avoids a needless exception on the happy path.
            $exists = DB::table($table)
                ->where('reference_id', $refId)
                ->exists();

            if (! $exists) {
                return $refId;
            }
        }

        // Last-resort: timestamp + random to guarantee uniqueness
        return "{$prefix}-{$date}-" . strtoupper(substr(uniqid('', true), -6));
    }

    private static function buildId(
        string $prefix,
        string $date,
        string $table,
        int    $attempt
    ): string {
        if ($attempt === 0) {
            // Determine next sequential number for today
            $pattern = "{$prefix}-{$date}-%";
            $count   = DB::table($table)
                ->where('reference_id', 'like', $pattern)
                ->count();

            $suffix = str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
        } else {
            // On collision retry, bump with a small random offset
            $count  = DB::table($table)
                ->where('reference_id', 'like', "{$prefix}-{$date}-%")
                ->count();

            $suffix = str_pad(
                (string) ($count + 1 + random_int(1, 99)),
                4,
                '0',
                STR_PAD_LEFT
            );
        }

        return "{$prefix}-{$date}-{$suffix}";
    }
}