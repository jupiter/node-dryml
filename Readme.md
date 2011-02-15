# DRYML - a template engine

A template engine for Node and Express that is compatible with EJS <https://github.com/visionmedia/ejs> yet has the power and view refactoring savvy of DRYML. 

DRYML as a template language was originally developed by Tom Locke for the Rails template engine as part of the web app builder, Hobo. See <http://hobocentral.net/manual/chapters/3_dryml.html> and <http://cookbook.hobocentral.net/manual/dryml-guide>.  

## Installation

    $ npm install dryml
    
Run tests:

    $ npm test dryml

## Usage Example

From String:

    dryml.render(str, options, function(buffer){
        console.log(buffer.str);
    });
    
For Express:

    app.get('/', function(req, res){
    	dryml.renderView('index', options, res);
    });
    
## Options

  - `locals`          Local variables object
  - `scope`           Function execution context
  - `debug`           Output sources and useful string
  - `trimWhitespace`  Removes all whitespace between tags
  
## DRYML Syntax

### Basic Layout (Pre-refactor)

Defining a tag (like a inline partial, to be reused):

    <def tag="page" attrs="title">
        <html>
            <head>
                <title><%= title %></title>
                <script type="text/javascript">
                    // Etc.
                </script>
            </head>
            <body>
                <tagbody/>
            </body>
        </html>
    </def>
    
Using a tag:
    
    <page title="Welcome">
        <div class="wrapper">
            <h1>Welcome</h1>
            <div class="content">
                <p>Some Content</p>
            </div>
            <div class="navigation">
                <ul>
                    <li><a href="/one">One</a></li>
                    <li><a href="/two">Two</a></li>
                    <li class="selected"><a href="/three">Three</li>
                </ul>
            </div>
        </div>
    </page>
    
Output:

    <html>
        <head>
            <title>Welcome</title>
            <script type="text/javascript">
                // Etc.
            </script>            
        </head>
        <body>
            <h1>Welcome</h1>
            <div class="content">
                <p>Some Content</p>
            </div>
            <div class="navigation">
                <ul>
                    <li><a href="/one">One</a></li>
                    <li><a href="/two">Two</a></li>
                    <li class="selected"><a href="/three">Three</li>
                </ul>
            </div>
        </body>
    </html>    
    
### After Refactor (Important)

Defining multiple tags (in separate taglib file):

    <def tag="navigation" attrs="options,selected">
        <ul>
            <% for (var key in options) { %>
                <li class="%{ (key == selected) ? 'selected' : '' }"><a href="#{ '/' + key }"><%= options[key] %></a></li>
            <% } %>
            <tagbody/>
        </ul>
    </def>

    <def tag="page" attrs="title,navigation">
        <html>
            <head>
                <title><%= title %></title>
            </head>
            <body>
                 <h1><%= title %></h1>
                 <div class="content">
                    <tagbody />
                 </div>
                 <div class="navigation">
                    <navigation options="#{ {one:'One', two:'Two', three:'Three'} }" selected="%{ navigation }"/>
                 </div>
            </body>
        </html>
    </def>   
    
Using a tag:

    <taglib src="taglibfile" />
    
    <page title="Welcome" navigation="three">
        <p>Some Content</p>
    </page>

## License 

(Hobo for Rails)

Copyright (c) 2008 Tom Locke

(The MIT License)

Copyright (c) 2011 Pieter Raubenheimer <pieter@wavana.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

