# Generated by Django 5.1 on 2024-08-20 06:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('back', '0003_user_image_todomodel'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=100, unique=True),
        ),
    ]
