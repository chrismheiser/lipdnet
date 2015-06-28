from django.db import models


class Article(models.Model):
    title = models.CharField(max_length=64)
    content = models.TextField()