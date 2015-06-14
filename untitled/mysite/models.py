from django.db import models


class Login(models.Model):
    email = models.EmailField(max_length=35)
    password = models.CharField(max_length=30)

class Registration(models.Model):
    first = models.CharField(max_length=20)
    last = models.CharField(max_length=20)
    email = models.EmailField(max_length=35)
    password = models.CharField(max_length=30)
    confirm_password = models.CharField(max_length=30)
    organization = models.CharField(max_length=40)


