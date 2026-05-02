"use client";

import {useCreditContext} from '@/lib/context/CreditContext';

export function useCredits() {
    return useCreditContext();
}
