from django.urls import path
from .views import *
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns =[
    path('register/',RegisterView.as_view()),
    path('verify-otp/',VerifyOTPView.as_view()), 
    path('login/',LoginView.as_view()),
    path("resendotp/",ResendOtpView.as_view()),
    path('forgot/',ForgotPasswordView.as_view()),
    path('todo/<int:id>',DeleteUpdateTodoView.as_view()),
    path('todo/pin/<int:id>',PinTodoView.as_view()),
    path('todo/<int:todo_id>/tags/', AddTagsToTodoView.as_view(), name='add-tags-to-todo'),
    path('todos/',TodoView.as_view()),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)