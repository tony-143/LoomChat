from rest_framework import serializers
from rest_framework_simplejwt.tokens import *
from django.contrib.auth import *
from .models import *
import random
import string
from django.core.mail import send_mail
from back.models import User

User1 = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    
    class Meta:
        model = User1
        fields = ('email','first_name')
    
    def validate(self, attrs):
        email = "loom-"+attrs.get('email')
        if User.objects.filter(email=email):
            raise serializers.ValidationError("email already exists")
        return super().validate(attrs)
    
    def create(self,data):
        user = User1(
            email="loom-"+data.get('email'),
            first_name=data.get('first_name')
        )

        otp = ''.join(random.choices(string.digits, k=6))
        data['user'] = user
        
        user.set_otp(otp)
        # user.verifyOtp = True
        user.verifyOtp = True
        
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}.',
            settings.DEFAULT_FROM_EMAIL,
            [data.get('email')],
            fail_silently=False,
        )
        
        # user['message'] = "otp sended to email"
        
        user.save()
        return user
    
class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self,data):
        # print(data.get('email'))
        email = "loom-"+data.get('email')
        password = data.get('password')
        
        if email and password:
            try:
                tony = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({'email error':"invalid email"})
            
            user = authenticate(request=self.context.get('request'),email=email, password=password)
    
            if not user:
                raise serializers.ValidationError({'password error':"invalid password"})
        else:
            raise serializers.ValidationError("password and email required")
        
        refresh = RefreshToken.for_user(user)
        
        return {
            "refresh":str(refresh),
            "access":str(refresh.access_token)
        }
        
class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['id', 'meeting_code', 'start_time', 'end_time', 'participants','anonymous_participants']
        read_only_fields = ['id', 'meeting_code', 'start_time', 'host']

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)

class JoinMeetingSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50,required=True)
    meeting_code = serializers.CharField()

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class GetMeetingDetailsSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Participants
        fields = '__all__'

class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.IntegerField(required=True)
    
    def validate(self, data):
        email = "loom-"+data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            raise serializers.ValidationError("Email and OTP are required for verification")
        
        try:
            user = User.objects.get(email=email)
            # print(user,"----------")
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.- Please register.")
        print(user.otp,"  ",otp)
        if str(user.otp) != str(otp):
            # print(user.otp,"  ",otp)
            raise serializers.ValidationError("Invalid OTP. Please request a new one.")
        
        return data
    
    def create(self, data):
        email = "loom-"+data.get('email')
        try:
            user = User.objects.get(email=email)
            # print(user,"---k------")
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found. Please register.")
        
        user.otp = None
        user.is_active = True
        # user.verifyOtp = False  
        
        user.save()  
        return user
    
class OtpSendSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def create(self, data):
        email ="loom-"+data.get('email')
        
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({"error":"user not found please register"})
            otp = ''.join(random.choices(string.digits, k=6))
            send_mail(
                'Your OTP Code',
                f'Your OTP code is {otp}.',
                settings.DEFAULT_FROM_EMAIL,
                [data.get('email')],
                fail_silently=False,
            )
            user.otp=int(otp)
            user.verifyOtp = True
            user.save()
        else:
            raise serializers.ValidationError("please provide email")
        
        return data
    
class PasswordSetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(max_length=50,required=True,write_only=True)
    
    def create(self,data):
        email = "loom-"+data.get('email')
        password = data.get('password')
        
        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError("user not found with the email address")
            if user.verifyOtp !=False and user.otp==None:
                user.set_password(password)
                user.verifyOtp = False
                user.verifyOtp = False
                user.save()
            else:
                raise serializers.ValidationError("please verify your otp")
        else:
            raise serializers.ValidationError("email and password must be provided")
        
        data["sucess"]="paswrod seted"
        return data
class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields ='__all__'