from django.conf.urls import patterns, include, url
from django.contrib import admin
from geo import views

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'website.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    # url(r'^admin/', include(admin.site.urls)),
    url(r'^geo/', include('geo.urls')),

)
