<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Models\PricingTier;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    use AdminRequiresPermission;

    public function showRate()
    {
        return response()->json($this->ratePayload());
    }

    public function updateRate(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.subscription-plans')) {
            return $r;
        }

        $data = $request->validate([
            'usd_cdf_rate' => 'required|numeric|min:1|max:100000',
        ]);

        $rate = round((float) $data['usd_cdf_rate'], 4);
        $tier = PricingTier::query()->where('plan_name', 'Green Express')->first()
            ?: PricingTier::query()->where('is_active', true)->orderBy('id')->first();

        if (! $tier) {
            $tier = PricingTier::create([
                'plan_name' => 'Green Express',
                'min_employees' => 1,
                'max_employees' => 99999,
                'price_per_meal_usd' => 1.5,
                'price_per_meal_cdf' => round(1.5 * $rate, 2),
                'exchange_rate' => $rate,
                'currency' => 'USD',
                'description' => 'Taux de conversion administrateur Green Express',
                'is_active' => true,
            ]);
        } else {
            $tier->update([
                'exchange_rate' => $rate,
                'price_per_meal_cdf' => round((float) $tier->price_per_meal_usd * $rate, 2),
                'is_active' => true,
            ]);
        }

        return response()->json($this->ratePayload($tier->fresh()));
    }

    private function ratePayload(?PricingTier $tier = null): array
    {
        $tier ??= PricingTier::query()->where('plan_name', 'Green Express')->first()
            ?: PricingTier::query()->where('is_active', true)->orderBy('id')->first();

        $rate = $tier ? (float) $tier->exchange_rate : 2800.0;

        return [
            'base_currency' => 'USD',
            'quote_currency' => 'CDF',
            'usd_cdf_rate' => $rate > 0 ? $rate : 2800.0,
            'source' => $tier ? 'pricing_tier' : 'default',
            'updated_at' => $tier?->updated_at?->toIso8601String(),
        ];
    }
}
