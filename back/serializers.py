from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password,make_password
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from .backends import generate_otp
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User1=get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User1
        fields = ['email', 'password', 'name']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate(self,data):
        if User1.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError('email already exists please verify otp')
        return data
    
    def create(self,data):
        user = User1(
            email=data['email'],
            name=data['name'],
            password=make_password(data['password'])
        )
        otp=generate_otp()
        user.set_otp(otp)
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}.',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return user

class ResendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def create(self, data):
        try:
            user = User.objects.get(email=data.get('email'))
        except User.DoesNotExist:
            raise serializers.ValidationError('Please register first.')
        
        otp = generate_otp()
        user.otp = otp
        user.save()
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}.',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return user

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        try:
            user=User1.objects.get(email=email)
        except User1.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password')

        # print(check_password(password,user.password))
        if check_password(password, user.password) is not True:
            raise serializers.ValidationError('Invalid password')
        
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive, please verify to activate.")
        
        data['user'] = user
        return data
    
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    otp = serializers.IntegerField(required=True)
    
    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Email does not exist. Please register.")
        
        if (user.otp) != str(data['otp']):
            raise serializers.ValidationError("Invalid OTP.")
        
        data['user'] = user
        return data

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoModel
        fields = '__all__'
        read_only_fields = ['user','tags']
        
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def create(self, data):
        if not self.user:
            raise serializers.ValidationError("User is required")
        data['user'] = self.user
        return super().create(data)
    
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name',]
        
        