# Generated by Django 4.2.4 on 2023-09-20 07:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_alter_order_packages_array'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClosedOrders',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('api.order',),
        ),
        migrations.CreateModel(
            name='OpenOrders',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('api.order',),
        ),
    ]
