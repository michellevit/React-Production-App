# Generated by Django 4.2.4 on 2023-08-08 05:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_remove_order_dimensions_order_packages_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='ship_date',
            field=models.DateField(),
        ),
    ]
