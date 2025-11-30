from django.core.management.base import BaseCommand
from django.db import transaction
from apps.ai_integration.models import Conversation


class Command(BaseCommand):
    help = 'Find duplicate Conversation rows by (user, session_id). Use --purge to remove older duplicates keeping the newest.'

    def add_arguments(self, parser):
        parser.add_argument('--purge', action='store_true', help='Purge older duplicate rows, keep the most recent one')

    def handle(self, *args, **options):
        purge = options.get('purge')

        # Aggregate duplicates: group by user_id and session_id
        qs = Conversation.objects.values('user_id', 'session_id')
        duplicates = []

        # Use a dict to collect counts
        counts = {}
        for row in qs:
            key = (row['user_id'], row['session_id'])
            counts[key] = counts.get(key, 0) + 1

        for key, cnt in counts.items():
            if cnt > 1:
                duplicates.append((key[0], key[1], cnt))

        if not duplicates:
            self.stdout.write(self.style.SUCCESS('No duplicate conversations found.'))
            return

        self.stdout.write(self.style.WARNING(f'Found {len(duplicates)} duplicate conversation groups.'))
        for user_id, session_id, cnt in duplicates:
            self.stdout.write(f'User {user_id} Session {session_id}: {cnt} rows')

        if purge:
            self.stdout.write(self.style.WARNING('Purging older duplicates...'))
            total_removed = 0
            for user_id, session_id, cnt in duplicates:
                with transaction.atomic():
                    rows = Conversation.objects.filter(user_id=user_id, session_id=session_id).order_by('-started_at')
                    # Keep the first (newest), delete the rest
                    keep = rows.first()
                    to_delete = rows.exclude(id=keep.id)
                    removed = to_delete.count()
                    to_delete.delete()
                    total_removed += removed
                    self.stdout.write(self.style.SUCCESS(f'Purged {removed} rows for user {user_id} session {session_id}'))

            self.stdout.write(self.style.SUCCESS(f'Total purged rows: {total_removed}'))
        else:
            self.stdout.write('Run with --purge to remove older duplicates (keeps newest).')
