# yourapp/pipeline.py
from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def return_tokens(strategy, details, user=None, *args, **kwargs):
    if user:
        tokens = get_tokens_for_user(user)
        return strategy.redirect(f"http://localhost:8000?access_token={tokens['access']}&refresh_token={tokens['refresh']}")
