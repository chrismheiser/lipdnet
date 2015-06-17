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

class Upload(models.Model):
    filename = models.FileField(upload_to=None, max_length=70)
    files = models.FilePathField(match='*.txt$, *.docx$, *.doc$, *.lipd$', )
