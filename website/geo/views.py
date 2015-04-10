from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
# from models import UploadForm

# Create your views here.


def index(request):
    return render(request, 'index.html')


def upload(request):
    return render(request, 'upload.html')

