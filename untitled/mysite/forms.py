__author__ = 'chrisheiser1'
from django import forms
from django.forms import ModelForm
from mysite.models import Login, Registration


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


