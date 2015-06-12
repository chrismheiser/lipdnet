from django.contrib import admin
from django.conf.urls import patterns, url

urlpatterns = patterns('',
                        # Examples:
                        # url(r'^$', 'mysite.views.home', name='home'),
                        # url(r'^blog/', include('blog.urls')),
                       url(r'^$', "geo.views.home", name='home'),
                       url(r'^about', "geo.views.about", name='about'),
                       url(r'^convert', "geo.views.convert", name='convert'),
                       url(r'^login', "geo.views.login", name='login'),
                       url(r'^schema', "geo.views.schema", name='schema'),
                       url(r'^validate', "geo.views.validate", name='validate')
                    )
