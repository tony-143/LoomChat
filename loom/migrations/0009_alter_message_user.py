# Generated by Django 5.1 on 2024-09-15 15:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loom', '0008_remove_message_anonymous_user_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='user',
            field=models.CharField(max_length=255),
        ),
    ]
