# RODER Indica V2 - Project Instructions

## Key Personnel
- **Gislene**: Gerente Comercial.
- **Luana**: Responsável pela triagem e gestão de leads.

## Business Rules
- **Negotiation Validity**: Proposals are valid for 60 days starting from when the budget is uploaded.
- **Commission Calculation**: 
  - Commission is calculated on the `base_commission_value`.
  - If a discount is applied, it must be deducted from the `base_commission_value` before applying the commission rate.
  - Commission rate is fixed based on the indicator's profile and cannot be changed during negotiation.
- **Lead Protection**: 60-day protection starts when the budget is sent. If no sale occurs, the lead is cancelled but can be renewed if interest is proven.
- **Manager Warnings**: A warning should be displayed to Gislene and Luana (Managers/Admins) if an indication is in 'negotiating' status but lacks a `base_commission_value`.
