from django.shortcuts import render
from .serializers import * 
from .models import * 
from rest_framework import *
from rest_framework_simplejwt.views import *
from rest_framework.views import *
from rest_framework.permissions import * 
from rest_framework.exceptions import NotFound
from rest_framework.viewsets import *
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import json

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer

class LoginView(TokenObtainPairView):
    serializer_class = UserLoginSerializer

class VerifyOtpView(generics.CreateAPIView):
    serializer_class = VerifyOtpSerializer
    
class PasswordView(generics.CreateAPIView):
    serializer_class = PasswordSetSerializer

class OtpSendView(generics.CreateAPIView):
    serializer_class = OtpSendSerializer

class GetUserDetailsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = {
            'user': user.email,
            'name': user.first_name,
        }
        return Response({"details":(data)})

class CreateMeetingView(ModelViewSet):
    queryset=Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)
    def get_queryset(self):
        return self.request.user.hosted_meetings.all()
    def destroy(self, request, *args, **kwargs):
        
        meeting = self.get_object()
        if meeting.host != request.user:
            return Response({'detail': 'You are not authorized to delete this meeting.'}, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)

class JoinMeetingView(APIView):
    permission_classes = []  # No authentication required

    def post(self, request, *args, **kwargs):
        meeting_code = request.data.get('meeting_code')
        name = request.data.get('name')
        
        if not name and not request.user.is_authenticated:
            return Response({"error":"plase provide name or login to join"},status=status.HTTP_400_BAD_REQUEST)

        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        message = ''

        if meeting.host.first_name == name:
            return Response({"error":"user already joined with this name"},status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.is_authenticated:
            # Authenticated user
            # try:
            #     name_ = AnonymousParticipant.objects.get(name = request.user.first_name , meeting = meeting)
            #     if name_:
            #         return Response({"error":"user already joined with this name"},status=status.HTTP_400_BAD_REQUEST)
            # except AnonymousParticipant.DoesNotExist:
                auth_user , created = Participants.objects.get_or_create(name=request.user.first_name, meeting=meeting)
                if created:
                    meeting.participants.add(auth_user)
                    message = f'{request.user.first_name} send to a joining request to host user'
                else:
                    message = f"{request.user.first_name} already joined in the meeting {meeting.host} or wait for approval"
        else:
            # Anonymous user
            try:
                name = Participants.objects.get(name = name , meeting = meeting)
                return Response({"error":"user already joined with this name"},status=status.HTTP_400_BAD_REQUEST)
            except Participants.DoesNotExist:
                anonymous_participant, created = AnonymousParticipant.objects.get_or_create(name=name, meeting=meeting)
                if created:
                    meeting.anonymous_participants.add(anonymous_participant)
                    message = f"{name} joined the meeting {meeting.host}"
                else:
                    return Response({"error":"user already joined with this name or wait for approval"},status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"message": message}, status=status.HTTP_200_OK)
    
    def patch(self, request):
        meeting_code = request.data.get('meeting_code')
        name = request.data.get('name')
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        
        if request.user.is_authenticated and meeting.host != request.user:
            return Response({"error": "You are not authorized to accept to join user in meeting."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = AnonymousParticipant.objects.get(name=name, meeting=meeting)
            user.approval = True
            user.save()
            return Response({"success": f"User '{name}' joined in the meeting."}, status=status.HTTP_200_OK)
        except AnonymousParticipant.DoesNotExist:
            try:
                user = Participants.objects.get(name=name, meeting=meeting)
                user.approval = True
                user.save()
                return Response({"success": f"User '{name}' joined in the meeting."}, status=status.HTTP_200_OK)
            except Participants.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request):
        meeting_code = request.data.get('meeting_code')
        name = request.data.get('name')
        
        if not name and not request.user.is_authenticated:
            return Response({"error":"plase provide name or authenticate to delete"},status=status.HTTP_400_BAD_REQUEST)

        meeting  = get_object_or_404(Meeting , meeting_code = meeting_code)
        anonymous_participant = None
        
        if request.user.is_authenticated:
            # if request.user.first_name in meeting.participants.all():
            try:
                auth_user = Participants.objects.get(name = request.user.first_name,meeting = meeting)
            except Participants.DoesNotExist:
                return Response({"error":"User not found to delete"},status=status.HTTP_400_BAD_REQUEST)
            meeting.participants.remove(auth_user)
            auth_user.delete()
            message = f'{request.user.first_name} removed'
            # else:
                # return Response({"error": "User is not a participant in this meeting."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                anonymous_participant = AnonymousParticipant.objects.get(name=name, meeting=meeting)
                meeting.anonymous_participants.remove(anonymous_participant)
                anonymous_participant.delete()
                message = f"{name} removed the meeting {meeting.host}"
                
            except AnonymousParticipant.DoesNotExist:
                return Response({"error": "Anonymous participant not found."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": message}, status=status.HTTP_200_OK)

class DeleteMeetingUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        meeting_code = request.data.get('meeting_code')
        name = request.data.get('name')
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)

        if meeting.host != request.user:
            return Response({"error": "You are not authorized to delete users from this meeting."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = AnonymousParticipant.objects.get(name=name, meeting=meeting)
            meeting.anonymous_participants.remove(user)
            user.delete()
            return Response({"success": f"User '{name}' removed from the meeting."}, status=status.HTTP_200_OK)
        except AnonymousParticipant.DoesNotExist:
            try:
                user = Participants.objects.get(name=name, meeting=meeting)
                meeting.participants.remove(user)
                user.delete()
                return Response({"success": f"User '{name}' removed from the meeting."}, status=status.HTTP_200_OK)
            except Participants.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
class DeleteUserFromMeeting(APIView):
    def delete(self, request):
        name = request.data.get('name')
        meeting_code = request.data.get('meeting_code')
        if not name or not meeting_code:
            return Response({"error": "meeting code and name required to delete"},status=status.HTTP_404_NOT_FOUND)
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        try:
            user = AnonymousParticipant.objects.get(name=name, meeting=meeting)
            meeting.anonymous_participants.remove(user)
            user.delete()
            return Response({"success": f"User '{name}' removed from the meeting."}, status=status.HTTP_200_OK)
        except AnonymousParticipant.DoesNotExist:
            try:
                user = Participants.objects.get(name=name, meeting=meeting)
                meeting.participants.remove(user)
                user.delete()
                return Response({"success": f"User '{name}' removed from the meeting."}, status=status.HTTP_200_OK)
            except Participants.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
class getMeetingIdView(APIView):
    def post(self, request):
        meeting_code = request.data.get('meeting_code')
        # name = request.data.get('name')
        if not meeting_code:
            return Response({"error": "please provide name and meeting code to get id"},status=status.HTTP_400_BAD_REQUEST)
        meeting = get_object_or_404(Meeting, meeting_code = meeting_code)
        if meeting:
            return Response({"success":{meeting.id,meeting.host.first_name}},status=status.HTTP_200_OK)
        return Response({"error":"invalid meeting id"})
            
class GetMeetingDetailsView(generics.ListAPIView):
    permission_classes = []
    serializer_class = GetMeetingDetailsSerializer  # You might need to adjust this for multiple models

    def get_queryset(self):
        meeting_id = self.kwargs.get('meeting_id')
        
        meeting = get_object_or_404(Meeting, id=meeting_id)
        
        if self.request.user.is_authenticated and self.request.user == meeting.host:
            participants = list(Participants.objects.filter(meeting_id=meeting_id))
            anonymous_participants = list(AnonymousParticipant.objects.filter(meeting_id=meeting_id))
        else:
            participants = list(Participants.objects.filter(meeting_id=meeting_id, approval = True))
            anonymous_participants = list(AnonymousParticipant.objects.filter(meeting_id=meeting_id, approval = True))
            
        # Combine the querysets into a list
        combined_results = participants + anonymous_participants
        
        return combined_results

class CheckJoinedUserView(APIView):
    def post(self, request, *args, **kwargs):
        meeting_code = request.data.get('meeting_code')
        name = request.data.get('name')
        
        if not name and not meeting_code:
            return Response({"error": "please provide a name and a meeting_code"})
        
        meeting = get_object_or_404(Meeting, meeting_code = meeting_code)
        if meeting.host.first_name == name:
            return Response({"success":"user approved"},status=status.HTTP_200_OK)
        try:
            user = Participants.objects.get(meeting=meeting,name=name)
            if user.approval:
                return Response({"success":"user approved"},status=status.HTTP_200_OK)
            return Response({"error": "user not approved"},status=status.HTTP_400_BAD_REQUEST)
        
        except Participants.DoesNotExist:
            try:
                user = AnonymousParticipant.objects.get(meeting=meeting,name=name)
                if user.approval:
                    return Response({"success":"user approved"},status=status.HTTP_200_OK)
                return Response({"error": "user not approved"},status=status.HTTP_400_BAD_REQUEST)
            
            except AnonymousParticipant.DoesNotExist:
                return Response({"errorN": "user not found"},status=status.HTTP_400_BAD_REQUEST)
    
class MessageView(generics.CreateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = []
    
    # def perform_create(self, serializer):
    #     user = self.request.user if self.request.user.is_authenticated else None
    #     anonymous_user = self.request.data['anonymous_user']
        
    #     # if not user and not anonymous_user:
    #     #     return Response({"error ":"plaese provide name or login"})
        
    #     if not user:
    #         anonymous_user = serializer.validated_data.get('anonymous_user')
            
    #     serializer.save(user=user, anonymous_user=anonymous_user)

class GetMessageView(generics.ListAPIView):
    # queryset = Message.objects.all()
    serializer_class = MessageSerializer
    
    def get_queryset(self):
        meeting_id = self.kwargs.get('meeting_id')
        # data = get_object_or_404(Message, meeting_id = meeting_id)
        
        return Message.objects.filter(meeting_id=meeting_id)

class RatingView(APIView):
    def post(self, request):
        serializer = RatingSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success":serializer.data},status=status.HTTP_200_OK)
        return Response({"error": serializer.errors},status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, *args, **kwargs):
        data = Rating.objects.all()
        # Pass the QuerySet directly to the serializer
        serializer = RatingSerializer(data, many=True)  # No need to use 'data='
        return Response({"success": serializer.data}, status=status.HTTP_200_OK)