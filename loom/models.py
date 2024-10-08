import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Meeting(models.Model):
    host = models.ForeignKey(User, related_name='hosted_meetings', on_delete=models.CASCADE)
    meeting_code = models.CharField(max_length=10, unique=True, editable=False)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)
    participants = models.ManyToManyField("Participants", related_name='meetings', blank=True)
    anonymous_participants = models.ManyToManyField('AnonymousParticipant', related_name='participating_meetings', blank=True)

    def save(self, *args, **kwargs):
        if not self.meeting_code:
            self.meeting_code = self.generate_unique_code()
        super(Meeting, self).save(*args, **kwargs)

    def generate_unique_code(self):
        return str(uuid.uuid4())[:8]

    def __str__(self):
        return f"Meeting {self.meeting_code} hosted by {self.host}"

class Participants(models.Model):
    meeting = models.ForeignKey(Meeting, related_name="auth_participants",on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    approval = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

class AnonymousParticipant(models.Model):
    meeting = models.ForeignKey(Meeting, related_name='anonymous_attendees', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    approval = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    meeting = models.ForeignKey(Meeting, related_name='messages', on_delete=models.CASCADE)
    user = models.CharField(max_length=255,)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message by {self.user or self.anonymous_user.name} at {self.timestamp}"
