from django.shortcuts import render
from .serializers import *
from .models import *
from rest_framework.views import APIView
from rest_framework.status import *
from rest_framework.response import *
from django.core.mail import send_mail
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken


class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = UserSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({'success': 'otp sended successfully please verify', 'data':serializer.data},status=HTTP_201_CREATED)
        
        return Response({'error': serializer.errors},status=HTTP_401_UNAUTHORIZED)

class VerifyOTPView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            try:
                user = User.objects.get(email=email, otp=otp)
            except User.DoesNotExist:
                return Response({'error': 'Invalid email or OTP'}, status=HTTP_400_BAD_REQUEST)

            # Mark user as active and clear OTP
            user.is_active = True
            user.otp = ''
            user.save()
            return Response({'success': 'Email verified successfully'}, status=HTTP_200_OK)
        return Response({'error': serializer.errors}, status=HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.password=make_password(serializer.validated_data['new_password'])
            user.otp=''
            user.save()
            return Response({'success':'password changed successfully'},status=HTTP_200_OK)
        return Response({'error': serializer.errors}, status=HTTP_400_BAD_REQUEST)

class ResendOtpView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ResendOtpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success':'otp resended'},status=HTTP_200_OK)
        return Response({'error': serializer.errors}, status=HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user=serializer.validated_data['user']
            refresh = RefreshToken.for_user(user=user)
            access_token = refresh.access_token

            return Response({'success':{
                'refresh':str(refresh),
                'access':str(access_token)
                }},status=HTTP_200_OK)
        return Response({'error':serializer.errors},status=HTTP_400_BAD_REQUEST)

class TodoView(APIView):
    permission_classes=[IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = TodoSerializer(data=request.data,user=request.user)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': serializer.data},status=HTTP_201_CREATED)
        return Response({'error': serializer.errors},status=HTTP_400_BAD_REQUEST)
    
    def get(self, request, *args, **kwargs):
        
        todos=TodoModel.objects.filter(user=request.user)
        serializer = TodoSerializer(data=todos,many=True)
        serializer.is_valid()
        
        return Response({'success':serializer.data},status=HTTP_200_OK)
    
    def patch(self, request, *args, **kwargs):
        todo_id = request.data.get('id')
        title = request.data.get('title')
        description = request.data.get('description')

        if not todo_id:
            return Response({'error': 'ID not provided'}, status=HTTP_400_BAD_REQUEST)

        try:
            todo = TodoModel.objects.get(id=todo_id, user=request.user)
            if title:
                todo.title = title
            if description:
                todo.description = description
            todo.save()
            return Response({'success': 'Todo updated'}, status=HTTP_200_OK)
        except TodoModel.DoesNotExist:
            return Response({'error': 'Todo not found'}, status=HTTP_404_NOT_FOUND)

class DeleteUpdateTodoView(APIView):
    permission_classes=[IsAuthenticated]
        
    def delete(self, request, *args, **kwargs):
        todo_id = kwargs.get('id')  
        if not todo_id:
            return Response({'error': 'ID not provided'}, status=HTTP_400_BAD_REQUEST)
        try:
            todo = TodoModel.objects.get(id=todo_id, user=request.user)  
            todo.delete()
            return Response({'success': 'Todo deleted'}, status=HTTP_200_OK)
        except TodoModel.DoesNotExist:
            return Response({'error': 'Todo does not exist'}, status=HTTP_400_BAD_REQUEST)
        
class PinTodoView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request , *args, **kwargs):
        todo_id = kwargs.get('id')
        id=request.data.get('id')
        if not todo_id:
            return Response({'error': 'ID not provided'}, status=HTTP_400_BAD_REQUEST)
        try:
            todo = TodoModel.objects.get(id=todo_id, user=request.user)  
            todo.pined=True
            todo.save()
            return Response({'success': 'Todo pined'}, status=HTTP_200_OK)
        except TodoModel.DoesNotExist:
            return Response({'error': 'Todo does not exist'}, status=HTTP_400_BAD_REQUEST)
        
    def delete(self, request, *args, **kwargs):
        todo_id = kwargs.get('id')  
        if not todo_id:
            return Response({'error': 'ID not provided'}, status=HTTP_400_BAD_REQUEST)
        try:
            todo = TodoModel.objects.get(id=todo_id, user=request.user)  
            todo.pined=False
            todo.save()
            return Response({'success': 'Todo pin removed'}, status=HTTP_200_OK)
        except TodoModel.DoesNotExist:
            return Response({'error': 'Todo does not exist'}, status=HTTP_400_BAD_REQUEST)

class AddTagsToTodoView(APIView):
    permission_classes=[IsAuthenticated]
    
    def post(self, request, todo_id):
        todo = get_object_or_404(TodoModel, id=todo_id)
        tag_names = request.data.get('tags', [])

        for tag_name in tag_names:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            todo.tags.add(tag)

        return Response({
            'message': 'Tags added successfully',
            'tags': TagSerializer(todo.tags.all(), many=True).data
        }, status=HTTP_200_OK)
        
    def get(self, request,todo_id):
        todo = get_object_or_404(TodoModel,id=todo_id)
        tags = todo.tags.all()
        return Response(TagSerializer(tags,many=True).data,status=HTTP_200_OK)
    
    def put(self,request,todo_id):
        todo = get_object_or_404(TodoModel,id=todo_id)
        tags = request.data.get('tags',[])
        todo.tags.clear()
        
        for tag in tags:
            tag,created = Tag.objects.get_or_create(name=tag)
            todo.tags.add(tag)
        
        return Response({
            'message': 'Tags updated successfully',
            'tags': TagSerializer(todo.tags.all(), many=True).data
        }, status=HTTP_200_OK)