from django.conf.urls import patterns, include, url
from django.contrib import admin
from geo.views import index, splash

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'website.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    # url(r'^admin/', include(admin.site.urls)),
    url(r'^$', index),
    url(r'^splash', splash),

)
