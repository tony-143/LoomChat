from django.urls import path,re_path
from .consumers import *

websocket_urlpatterns = [
re_path(r'ws/meeting/(?P<meeting_id>[0-9a-f-]+)/(?P<user>[^/]+)/$', MeetingChatConsumer.as_asgi()),]

# sudo service redis-server start
