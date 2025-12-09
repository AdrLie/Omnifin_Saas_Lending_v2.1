from django.core.management.base import BaseCommand
from django.db import transaction
from apps.subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Create default subscription plans if they do not exist'

    def handle(self, *args, **options):
        plans_data = [
            {
                'name': 'Starter',
                'plan_type': 'basic',
                'price': 29.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 50000,
                'voice_tokens_limit': 5000,
                'max_users': 2,
            },
            {
                'name': 'Professional',
                'plan_type': 'premium',
                'price': 79.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 200000,
                'voice_tokens_limit': 20000,
                'max_users': 10,
            },
            {
                'name': 'Business',
                'plan_type': 'premium',
                'price': 199.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 500000,
                'voice_tokens_limit': 50000,
                'max_users': 50,
            },
            {
                'name': 'Enterprise',
                'plan_type': 'enterprise',
                'price': 499.99,
                'billing_period': 'monthly',
                'llm_tokens_limit': 1000000,
                'voice_tokens_limit': 100000,
                'max_users': 500,
            },
        ]

        created_count = 0
        for plan_data in plans_data:
            try:
                with transaction.atomic():
                    plan, created = SubscriptionPlan.objects.get_or_create(
                        name=plan_data['name'],
                        defaults={
                            'plan_type': plan_data['plan_type'],
                            'price': plan_data['price'],
                            'billing_period': plan_data['billing_period'],
                            'llm_tokens_limit': plan_data['llm_tokens_limit'],
                            'voice_tokens_limit': plan_data['voice_tokens_limit'],
                            'max_users': plan_data['max_users'],
                        }
                    )
                    if created:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ Created plan: {plan.name} (${plan.price}/month)'
                            )
                        )
                        created_count += 1
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'- Plan already exists: {plan.name}'
                            )
                        )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create plan {plan_data["name"]}: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Plans setup complete! Created {created_count} new plan(s).'
            )
        )
