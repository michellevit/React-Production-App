# Generated by Django 4.2.4 on 2023-09-07 02:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0018_alter_order_notes_array'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='packages_array',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]