from django.urls import *
from .views import *
from django.conf.urls import *
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'meetings',CreateMeetingView,basename='meeting')
# router.register(r'meeting/<str:meeting_code>/',GetMeetingDetailsView,basename='meeting_details')

urlpatterns=[
    path('', include(router.urls)),
    path('register/',RegisterView.as_view()),
    path('verify-otp/',VerifyOtpView.as_view()),
    path('setpassword/',PasswordView.as_view()),
    path('otp/',OtpSendView.as_view()),
    path('token/refresh/',TokenRefreshView.as_view()),
    path('login/',LoginView.as_view()),
    path('getuserdetails/',GetUserDetailsView.as_view()),
    path('messages/<int:meeting_id>/', GetMessageView.as_view(),),
    path('join/',JoinMeetingView.as_view()),
    path('join/delete/',DeleteMeetingUsersView.as_view()),
    path('messages/', MessageView.as_view(),),
    path('meeting/id/', getMeetingIdView.as_view(),),
    path('check/',CheckJoinedUserView.as_view(),),
    path('meeting/<int:meeting_id>/', GetMeetingDetailsView.as_view(),),
    path('deleteuser',DeleteUserFromMeeting.as_view(),),
    path('rating/',RatingView.as_view(),),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        re_path(r'^__debug__/', include(debug_toolbar.urls)),
    ]