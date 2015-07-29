__author__ = 'chrisheiser1'
from django import forms
from django.forms import ModelForm
from mysite.models import Login, Registration, Upload


class LoginForm(ModelForm):
    class Meta:
        model = Login
        fields = '_all_'
        widgets = {
            'password': forms.PasswordInput(),
        }

class RegistrationForm(ModelForm):
    class Meta:
        model = Registration
        exclude = 'confirm_password'
        widgets = {
            'password': forms.PasswordInput(),
        }

class UploadForm(ModelForm):
    class Meta:
        model = Upload
        fields = '_all_'
