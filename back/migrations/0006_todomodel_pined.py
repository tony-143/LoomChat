# Generated by Django 5.1 on 2024-08-25 14:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('back', '0005_alter_todomodel_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='todomodel',
            name='pined',
            field=models.BooleanField(default=False),
        ),
    ]
