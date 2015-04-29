from django.conf.urls import patterns, include, url
from django.contrib import admin
from geo import views

urlpatterns = patterns('',

    url(r'^$', views.index, name='index'),
    url(r'^$', views.splash, name='splash')
)
