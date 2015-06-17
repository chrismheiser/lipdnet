from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect

# from website.models import

# Create your views here.

def home(request):
    return render(request, 'home.html')

def about(request):
    return render(request, 'about.html')

def validate(request):
    return render(request, 'validate.html')

def convert(request):
    return render(request, 'convert.html')

def login(request):
    return render(request, 'login.html')

def schema(request):
    return render(request, 'schema.html')

def demo(request):
    return render(request, 'demo.html')

def upload(request):
    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            upload = Upload()
            save_instance(form, upload)