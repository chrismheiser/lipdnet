from django.db import models
from django.core.urlresolvers import reverse

from djangotoolbox.fields import ListField, EmbeddedModelField


class Post(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField()
    body = models.TextField()
    comments = ListField(EmbeddedModelField('Comment'), editable=False)

    def get_absolute_url(self):
        return reverse('post', kwargs={"slug": self.slug})

    def __unicode__(self):
        return self.title

    class Meta:
        ordering = ["-created_at"]


class Comment(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    body = models.TextField(verbose_name="Comment")
    author = models.CharField(verbose_name="Name", max_length=255)


# from django.db import models
#
# class Login(models.Model):
#     email = models.EmailField(max_length=35)
#     password = models.CharField(max_length=30)
#
# class Registration(models.Model):
#     first = models.CharField(max_length=20)
#     last = models.CharField(max_length=20)
#     email = models.EmailField(max_length=35)
#     password = models.CharField(max_length=30)
#     confirm_password = models.CharField(max_length=30)
#     organization = models.CharField(max_length=40)
#
# class Upload(models.Model):
#     filename = models.FileField(upload_to=None, max_length=70)
#     files = models.FilePathField(match='*.txt$, *.docx$, *.doc$, *.lipd$', )
