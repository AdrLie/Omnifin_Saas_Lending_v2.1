"""
Management command to create initial subscription plans
"""

from django.core.management.base import BaseCommand
from apps.subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Create initial subscription plans'

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'Starter',
                'plan_type': 'basic',
                'price': 29.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 50000,
                'voice_tokens_limit': 25000,
                'max_users': 5,
                'stripe_price_id': 'price_starter_monthly',
                'is_active': True,
            },
            {
                'name': 'Professional',
                'plan_type': 'professional',
                'price': 79.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 150000,
                'voice_tokens_limit': 75000,
                'max_users': 15,
                'stripe_price_id': 'price_professional_monthly',
                'is_active': True,
            },
            {
                'name': 'Business',
                'plan_type': 'enterprise',
                'price': 199.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 500000,
                'voice_tokens_limit': 250000,
                'max_users': 50,
                'stripe_price_id': 'price_business_monthly',
                'is_active': True,
            },
            {
                'name': 'Enterprise',
                'plan_type': 'enterprise',
                'price': 499.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 2000000,
                'voice_tokens_limit': 1000000,
                'max_users': 200,
                'stripe_price_id': 'price_enterprise_monthly',
                'is_active': True,
            },
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created plan: {plan.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⟳ Updated plan: {plan.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted: {created_count} created, {updated_count} updated'
            )
        )
