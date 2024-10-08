from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, name, password, **extra_fields)

class User(AbstractBaseUser):
    email = models.EmailField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100,default=True)
    verifyOtp = models.BooleanField(default=False)
    # user_type = models.ForeignKey()
    is_active = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    image = models.ImageField(upload_to='profile_images/',blank=True, null=True)
            
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    def set_otp(self, otp):
        self.otp = otp
        self.save()
        
    @property
    def is_staff(self):
        return self.is_admin
    
class Tag(models.Model):
    name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name

class TodoModel(models.Model):
    user = models.ForeignKey(User, related_name="todos", on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    description = models.TextField()
    created = models.DateTimeField(auto_now_add=True)  
    updated = models.DateTimeField(auto_now=True)  
    pined = models.BooleanField(default=False)
    tags = models.ManyToManyField(Tag, related_name="todos")
        
    def __str__(self):
        return self.title