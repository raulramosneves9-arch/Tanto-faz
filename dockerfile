FROM httpd:alpine
COPY index.html /usr/local/apache2/htdocs/
COPY index.css /usr/local/apache2/htdocs/