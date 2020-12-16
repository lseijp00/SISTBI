var express = require ('express');
var path = require ('path');
var logger = require ('morgan');
var bodyParser = require ('body-parser');
var neo4j = require ('neo4j-driver');
const pug = require('pug');

/*jsdom para poder utilizar dom con nodejs
const jsdom = require("jsdom");
const { JSDOM } = jsdom;*/


var app = express ();
//View-Engine
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'pug');
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
//app.use(express.static(path.join(__dirname,'public')));
app.use( express.static( "public" ) );

/* var driver = neo4j.driver("bolt://100.26.227.192:37072", neo4j.auth.basic("neo4j","engineering-blinks-cruiser" )); */
var driver2 = neo4j.driver("bolt://54.210.172.235:33638", neo4j.auth.basic("neo4j","moment-tuition-detentions" ));

//var session = driver.session();
var sessionNueva = driver2.session()


//Inicio de la página
app.get('/', function(req,res){
    var movieArray=[];
    sessionNueva
        .run('MATCH (n:Movie) RETURN n limit 12')
        .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                });
            });
            
            sessionNueva
                .run('MATCH (n:Actor) RETURN n order by n.id limit 12')
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,        
                        });
                       
                    });
                    res.render('index', {
                        movies: movieArray,
                        actors: actorArray,
                    });
                    

                })
                .catch(function(err){
                    console.log(err);
                });
        })
        .catch(function(err){
            console.log(err);
        });
        
})


//Muestra las películas iniciales a modo introducción
app.post('/movies/list', function(req,res){

    sessionNueva
        .run('MATCH(n:Movie) RETURN n  order by n.id LIMIT 18 ')
        .then(function (result){
            var movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,
                });
            });


            sessionNueva
                .run('MATCH (n:Actor) RETURN n order by n.id LIMIT 18 ')
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                            
                        });
                                           
                    });



                    sessionNueva
                        .run('match(n:Director) return n order by n.id limit 18')
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });


                            sessionNueva
                                .run('match(n:Movie)-[:tieneGenero]-(g:Genero) return g order by n.id limit 18')
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });                             
                                })
                                .catch(function(err){
                                    console.log(err);
                                });              
                        })
                        .catch(function(err){
                            console.log(err);
                        });
                })
                .catch(function(err){
                    console.log(err);
                });
        })
        .catch(function(err){
            console.log(err);
        });
})


var genresSearched=[];
var yearSearched=[];
var moviesSearched=[];
var contadorVecesSubmitPelícula=0;
var contadorVecesSubmitGenero=0;
var contadorVecesSubmitYear=0;
var mostFrequentFilm;
var mostFrequentGenre;
var mostFrequentYear;

//Muestra películas dependiendo de lo que se esciba en el input de arriba
app.post('/search-movies', function(req,res){
    var stringIntroducido = req.body.titleSearched;
    //Convierte la primera letra de la palabra en mayuscula para buscar en neo4j
    contadorVecesSubmitPelícula++;
    
    if(stringIntroducido.length>0){
    sessionNueva
        .run('MATCH (n:Movie) where toLower(n.title) contains toLower({titleMovie}) RETURN n order by n.id', {titleMovie:stringIntroducido})
        .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }


           sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie) where toLower(n.title) contains toLower({titleMovie}) RETURN p order by n.id', {titleMovie:stringIntroducido})
                .then(function(result2){
                    actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });                
                    });

                    sessionNueva
                        .run('MATCH (p:Director)-[:haDirigido]-(n:Movie) where toLower(n.title) contains toLower({titleMovie}) RETURN p order by n.id', {titleMovie:stringIntroducido})
                        .then(function(result3){
                            directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });


                            sessionNueva
                                .run('match (n:Movie)-[:tieneGenero]-(g:Genero) where toLower(n.title) contains toLower({titleMovie}) RETURN g order by n.id', {titleMovie:stringIntroducido})
                                .then(function(result4){
                                    generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                })
                                .catch(function(err){
                                    console.log(err);
                                });              
                        })
                        .catch(function(err){
                            console.log(err);
                        });
                })
                .catch(function(err){
                    console.log(err);
                });
        })
        .catch(function(err){
            console.log(err);
        });
    }else{
        sessionNueva
        .run('MATCH (n:Movie) return n limit 12')
        .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    image: record._fields[0].properties.image,
                    avgVote: record._fields[0].properties.avgVote,

                });
            });

           sessionNueva
                .run('MATCH (n:Actor) return n limit 12', {titleMovie:stringIntroducido})
                .then(function(result2){
                    actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                                           
                    });

                    sessionNueva
                        .run('MATCH (n:Director) return n limit 12', {titleMovie:stringIntroducido})
                        .then(function(result3){
                            directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });


                            sessionNueva
                                .run('MATCH (n:Genero) return n limit 12', {titleMovie:stringIntroducido})
                                .then(function(result4){
                                    generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                })
                                .catch(function(err){
                                    console.log(err);
                                });              
                        })
                        .catch(function(err){
                            console.log(err);
                        });
                })
                .catch(function(err){
                    console.log(err);
                });
        })
        .catch(function(err){
            console.log(err);
        });
    }

})

var sessionNueva = driver2.session()

//Muestra películas dependiendo de las elecciones de la izquierda
app.post('/show-movies',function(req, res){
    contadorVecesSubmitPelícula++;


    var yearIntroducido = req.body.year;
    var generoIntroducido = req.body.genero;
    var check = req.body.check;

    if(yearIntroducido==undefined){
        var elem=document.getElementById("elemento").innerHTML;
        elem.style.display='none';
    }

    //LOS TRES PRIMEROS IF'S SON PARA CUANDO NO SE PULSA LA OPCIÓN DE ORDENAR 

    //IF PARA CUANDO INSERTEMOS UN GENERO Y UN AÑO ------- TICK NO
    if(generoIntroducido.length>0 && yearIntroducido.length>0 && check==undefined){
        var year = yearIntroducido;
        var genero = generoIntroducido;
        contadorVecesSubmitGenero++;
        contadorVecesSubmitYear++;
        console.log("entramos con año y genero")

        //guardamos el genero que se ha buscado
        genresSearched.push(genero);
        console.log(genresSearched)

        //guardamos el año que se ha buscado
        yearSearched.push(year)
        console.log(yearSearched)

        if(year==1970 || year==1975 || year==1980 || year==1985 || year==1990 || year==1995){
            sessionNueva
            .run('match(n:Movie)-[:tieneGenero]->(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} return n', {yearMovie:neo4j.int(year),generoMovie:genero})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,
                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

            });

            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;


                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }



            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} RETURN p', {yearMovie:neo4j.int(year),generoMovie:genero})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} RETURN d', {yearMovie:neo4j.int(year),generoMovie:genero})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} RETURN g', {yearMovie:neo4j.int(year),generoMovie:genero})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                
                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }else{
            sessionNueva
            .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN n', {yearMovie:neo4j.int(year),generoMovie:genero})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,
                    
                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }


            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN p', {yearMovie:neo4j.int(year),generoMovie:genero})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });
                    

                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN d', {yearMovie:neo4j.int(year),generoMovie:genero})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN g', {yearMovie:neo4j.int(year),generoMovie:genero})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                
                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }
        

    }

    //IF PARA CUANDO INSERTEMOS SOLO EL AÑO --------- TICK NO
    if(yearIntroducido.length>0 && generoIntroducido.length==0 && check==undefined){
        var year = yearIntroducido;
        contadorVecesSubmitYear++;

        //como no hay genero, solo ponemos los generos que siguen en el array
        console.log("Generos:")
        console.log(genresSearched)

        //guardamos el año que se ha buscado
        console.log("Años:")
        yearSearched.push(year)
        console.log(yearSearched)

        //HACIENDO LA CENCIA PARA VER SI ME DEJA HACER ESTA MIERDA
        if(year==1970 || year==1975 || year==1980 || year==1985 || year==1990 || year==1995){
            sessionNueva
            .run('match(n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) return n', {yearMovie:neo4j.int(year)})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
                
            });
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }


            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) RETURN p', {yearMovie:neo4j.int(year)})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });
                        console.log(actorArray)

                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) RETURN d', {yearMovie:neo4j.int(year)})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });


                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) return g', {yearMovie:neo4j.int(year)})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                   

                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }

        else{
        sessionNueva
            .run('MATCH (n:Movie) where n.released=$yearMovie RETURN n', {yearMovie:neo4j.int(year)})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien                
            });
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }


            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie) where n.released=$yearMovie RETURN p', {yearMovie:neo4j.int(year)})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie) where n.released=$yearMovie RETURN d', {yearMovie:neo4j.int(year)})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie return g', {yearMovie:neo4j.int(year)})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                
                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }
    }   

    //IF PARA CUANDO INSERTEMOS SOLO EL GENERO ---------- TICK NO
    if(generoIntroducido.length>0 && yearIntroducido.length==0 && check==undefined){
        contadorVecesSubmitGenero++;
        var genero = generoIntroducido;

        //como no hay año, solo ponemos los años que siguen en el array
        console.log("Años:")
        console.log(yearSearched)

        //guardamos el año que se ha buscado
        console.log("Generos:")
        genresSearched.push(genero)
        console.log(genresSearched)
    

        sessionNueva
            .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN n', {generoMovie:genero})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
                
            });
            
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }

            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN p',{generoMovie:genero})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });

                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN d',{generoMovie:genero})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });

                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN g', {generoMovie:genero})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                   

                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
    }
    
    
    //LOS TRES SEGUDNOS IF'S SON PARA CUANDO SÍ SE PULSA LA OPCIÓN DE ORDENAR 

    //IF PARA CUANDO INSERTEMOS UN GENERO Y UN AÑO ------- TICK SI
    if(generoIntroducido.length>0 && yearIntroducido.length>0 && check=="on"){
        var year = yearIntroducido;
        var genero = generoIntroducido;
        console.log("entramos con año y genero")
        contadorVecesSubmitGenero++;
        contadorVecesSubmitYear++;

        //guardamos el genero que se ha buscado
        genresSearched.push(genero);
        console.log(genresSearched)

        //guardamos el año que se ha buscado
        yearSearched.push(year)
        console.log(yearSearched)

        if(year==1970 || year==1975 || year==1980 || year==1985 || year==1990 || year==1995){
            sessionNueva
            .run('match(n:Movie)-[:tieneGenero]->(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} return n order by n.avgVote desc', {yearMovie:neo4j.int(year),generoMovie:genero})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,
                    
                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }

            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} RETURN p order by n.avgVote desc', {yearMovie:neo4j.int(year),generoMovie:genero})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} RETURN d order by n.avgVote desc', {yearMovie:neo4j.int(year),generoMovie:genero})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) AND g.genero={generoMovie} RETURN g order by n.avgVote desc', {yearMovie:neo4j.int(year),generoMovie:genero})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                
                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }else{
            sessionNueva
            .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN n', {yearMovie:neo4j.int(year),generoMovie:genero})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,
                    
                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });
            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;

                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }

            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN p', {yearMovie:neo4j.int(year),generoMovie:genero})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN d', {yearMovie:neo4j.int(year),generoMovie:genero})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie and g.genero={generoMovie} RETURN g', {yearMovie:neo4j.int(year),generoMovie:genero})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                
                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }
        

    }
    //IF PARA CUANDO INSERTEMOS SOLO EL AÑO --------- TICK SI
    if(yearIntroducido.length>0 && generoIntroducido.length==0 && check=="on"){
        var year = yearIntroducido;

        contadorVecesSubmitYear++;

        //como no hay genero, solo ponemos los generos que siguen en el array
        console.log("Generos:")
        console.log(genresSearched)

        //guardamos el año que se ha buscado
        console.log("Años:")
        yearSearched.push(year)
        console.log(yearSearched)

        //HACIENDO LA CENCIA PARA VER SI ME DEJA HACER ESTA MIERDA
        if(year==1970 || year==1975 || year==1980 || year==1985 || year==1990 || year==1995){
            sessionNueva
            .run('match(n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) return n order by n.avgVote desc', {yearMovie:neo4j.int(year)})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });

            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;
         
                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }

            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) RETURN p order by n.avgVote desc ', {yearMovie:neo4j.int(year)})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) RETURN d order by n.avgVote desc ', {yearMovie:neo4j.int(year)})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released>=$yearMovie AND n.released<=($yearMovie+4) return g order by n.avgVote desc ', {yearMovie:neo4j.int(year)})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                

                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }

        else{
        sessionNueva
            .run('MATCH (n:Movie) where n.released=$yearMovie RETURN n order by n.avgVote desc', {yearMovie:neo4j.int(year)})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });

            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;
               
                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }

            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie) where n.released=$yearMovie RETURN p order by n.avgVote desc', {yearMovie:neo4j.int(year)})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie) where n.released=$yearMovie RETURN d order by n.avgVote desc', {yearMovie:neo4j.int(year)})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                                
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where n.released=$yearMovie return g order by n.avgVote desc', {yearMovie:neo4j.int(year)})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                    
                                

                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }
    }  
    //IF PARA CUANDO INSERTEMOS SOLO EL GENERO ---------- TICK SI
    if(generoIntroducido.length>0 && yearIntroducido.length==0 && check=="on"){

        contadorVecesSubmitGenero++;
        var genero = generoIntroducido;

        //como no hay año, solo ponemos los años que siguen en el array
        console.log("Años:")
        console.log(yearSearched)

        //guardamos el año que se ha buscado
        console.log("Generos:")
        genresSearched.push(genero)
        console.log(genresSearched)

        sessionNueva
            .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN n order by n.avgVote desc', {generoMovie:genero})
            .then(function (result){
            movieArray=[];
            result.records.forEach(function(record){
                movieArray.push({
                    id: record._fields[0].identity.low,
                    title:  record._fields[0].properties.title,
                    released: record._fields[0].properties.released,
                    overview: record._fields[0].properties.overview,
                    avgVote: record._fields[0].properties.avgVote,
                    image: record._fields[0].properties.image,

                });
                moviesSearched.push({
                    title:  record._fields[0].properties.title,
                });

                //se suma la length, entonces no se actualiza el valor del array, está bien
            });

            console.log("Películas contadas:")
            console.log("Se han contado "+moviesSearched.length+ " películas");
            console.log(" ")
            console.log("Generos contados:")
            console.log("Se han contado "+contadorVecesSubmitGenero+ " generos");
            console.log(" ")
            console.log("Años contados:")
            console.log("Se han contado "+contadorVecesSubmitYear+ " años");
            console.log(" ")
            console.log(moviesSearched)
            console.log("CONTADOR DE ACTUALIZACIONES: "+contadorVecesSubmitPelícula);

            //SACAR LA PELICULA MAS BUSCADA
            if(contadorVecesSubmitPelícula>=5){
                var counts = {};
                var compare = 0;
         
                (function(moviesSearched){
                for(var i = 0, len = moviesSearched.length; i < len; i++){
                    var word = moviesSearched[i].title;
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentFilm = moviesSearched[i].title;
                    }
                    }
                    console.log("La película más buscada es " +mostFrequentFilm)
                return mostFrequentFilm;
                })(moviesSearched);
            }

            //SACAR EL GENERO MAS BUSCADO
            if(contadorVecesSubmitGenero>=5){
                var counts = {};
                var compare = 0;
                (function(genresSearched){
                for(var i = 0, len = genresSearched.length; i < len; i++){
                    var word = genresSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentGenre = genresSearched[i];
                    }
                    }
                    console.log("El genero mas buscado es " +mostFrequentGenre)
                return mostFrequentGenre;
                })(genresSearched);
            }

            //SACAR EL AÑO MAS BUSCADO
            if(contadorVecesSubmitYear>=5){
                var counts = {};
                var compare = 0;
                (function(yearSearched){
                for(var i = 0, len = yearSearched.length; i < len; i++){
                    var word = yearSearched[i];
                    
                    if(counts[word] === undefined){
                        counts[word] = 1;
                    }else{
                        counts[word] = counts[word] + 1;
                    }
                    if(counts[word] > compare){
                            compare = counts[word];
                            mostFrequentYear = yearSearched[i];
                    }
                    }
                    console.log("El año mas buscado es el " +mostFrequentYear)
                return mostFrequentYear;
                })(yearSearched);
            }

            sessionNueva
                .run('MATCH (p:Actor)-[:ACTED_IN]-(n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN p order by n.avgVote desc',{generoMovie:genero})
                .then(function(result2){
                    var actorArray= [];
                    result2.records.forEach(function(record){
                        actorArray.push({
                            id: record._fields[0].identity.low,
                            name:  record._fields[0].properties.nombre,
                        });
                    });


                    sessionNueva
                        .run('MATCH (d:Director)-[:haDirigido]-(n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN d order by n.avgVote desc',{generoMovie:genero})
                        .then(function(result3){
                            var directorArray= [];
                            result3.records.forEach(function(record){
                                directorArray.push({
                                    id: record._fields[0].identity.low,
                                    name:  record._fields[0].properties.nombre,        
                                });
                            });

                            
                            sessionNueva
                            
                                .run('MATCH (n:Movie)-[:tieneGenero]-(g:Genero) where g.genero={generoMovie} RETURN g order by n.avgVote desc', {generoMovie:genero})
                                .then(function(result4){
                                    var generoArray= [];
                                    result4.records.forEach(function(record){
                                        generoArray.push({
                                            id: record._fields[0].identity.low,
                                            name:  record._fields[0].properties.genero,        
                                        });
                                    });
                                    res.render('redirect', {
                                        movies: movieArray,
                                        actors: actorArray,
                                        directors: directorArray,
                                        genero: generoArray,
                                        contadorVecesSubmitGenero:contadorVecesSubmitGenero,
                                        contadorVecesSubmitPelícula:contadorVecesSubmitPelícula,
                                    });
                                  
                                   

                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                            })
                        .catch(function(err){
                            console.log(err);
                        });
                    })
                .catch(function(err){
                    console.log(err);
                });
            })
            .catch(function(err){
                console.log(err);
            });
    }
});


var sessionNueva2 = driver2.session()

//Muestra películas recomendadas
app.post('/recommend-movie',function(req, res){

    console.log("VECES GENERO: "+contadorVecesSubmitGenero)
    console.log("VECES AÑO: "+contadorVecesSubmitYear)
    console.log("VECES SUBMIT: "+contadorVecesSubmitPelícula)

    console.log(mostFrequentFilm);
    console.log(mostFrequentYear);
    console.log(mostFrequentGenre);

    var film=mostFrequentFilm;

    if((mostFrequentYear==1970 || mostFrequentYear==1975 || mostFrequentYear==1980 || mostFrequentYear==1985 || mostFrequentYear==1990 || mostFrequentYear==1995) && mostFrequentYear.length>0){
        if(mostFrequentYear!=undefined && mostFrequentFilm!=undefined && mostFrequentGenre==undefined){
            sessionNueva2
            .run('match (n:Movie)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(n2:Movie) where n.title={titleMovie} return n2 as name order by n2.avgVote union match (n:Movie) where n.released>=$yearMovie AND n.released<=($yearMovie+4) return n as name order by n.avgVote',{titleMovie:mostFrequentFilm,yearMovie:neo4j.int(mostFrequentYear)})
            .then(function (result){
                var movieArray2=[];
                result.records.forEach(function(record){
                    movieArray2.push({
                        id: record._fields[0].identity.low,
                        title:  record._fields[0].properties.title,
                        released: record._fields[0].properties.released,
                        overview: record._fields[0].properties.overview,
                        avgVote: record._fields[0].properties.avgVote,
                        image: record._fields[0].properties.image,
                    });
                });
                res.render('recommend', {
                    movies2: movieArray2,
                    film:film,
                });                             

            })
            .catch(function(err){
                console.log(err);
            });
        }else if(mostFrequentYear!=undefined && mostFrequentFilm!=undefined && mostFrequentGenre!=undefined){
            sessionNueva2
            .run('match (n:Movie)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(n2:Movie) where n.title={titleMovie} return n2 as name union match (n:Movie)-[:tieneGenero]->(g:Genero) where g.genero={generoMovie} AND n.released>=$yearMovie AND n.released<=($yearMovie+4) return n as name',{yearMovie:neo4j.int(mostFrequentYear),titleMovie:mostFrequentFilm,generoMovie:mostFrequentGenre})
            .then(function (result){
                var movieArray2=[];
                result.records.forEach(function(record){
                    movieArray2.push({
                        id: record._fields[0].identity.low,
                        title:  record._fields[0].properties.title,
                        released: record._fields[0].properties.released,
                        overview: record._fields[0].properties.overview,
                        avgVote: record._fields[0].properties.avgVote,
                        image: record._fields[0].properties.image,
                    });
                });

                res.render('recommend', {
                    movies2: movieArray2,
                    film:film,
                });                             

            })
            .catch(function(err){
                console.log(err);
            });
        }else if(mostFrequentYear==undefined && mostFrequentFilm!=undefined && mostFrequentGenre==undefined){
            sessionNueva
            .run('MATCH (n:Movie) RETURN n limit 1')
            .then(function (result){
                res.render('indexAlert', {
                
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }else{
            sessionNueva
            .run('MATCH (n:Movie) RETURN n limit 1')
            .then(function (result){
                res.render('indexAlert', {
                
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }
    }else{

        if(mostFrequentYear==undefined && mostFrequentFilm!=undefined && mostFrequentGenre!=undefined){
            sessionNueva2
            .run('match (n:Movie)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(n2:Movie) where n.title={titleMovie} return n2 as name order by n2.avgVote union match (n:Movie)-[:tieneGenero]->(g:Genero)<-[:tieneGenero]-(n3:Movie) where g.genero={generoMovie} return n3 as name order by n3.avgVote',{titleMovie:mostFrequentFilm,generoMovie:mostFrequentGenre})
            .then(function (result){
                var movieArray2=[];
                result.records.forEach(function(record){
                    movieArray2.push({
                        id: record._fields[0].identity.low,
                        title:  record._fields[0].properties.title,
                        released: record._fields[0].properties.released,
                        overview: record._fields[0].properties.overview,
                        avgVote: record._fields[0].properties.avgVote,
                        image: record._fields[0].properties.image,
                    });
                });

                res.render('recommend', {
                    movies2: movieArray2,
                    film:film,
                });                             

            })
            .catch(function(err){
                console.log(err);
            });
        }else if(mostFrequentYear!=undefined && mostFrequentFilm!=undefined && mostFrequentGenre==undefined){
            sessionNueva2
            .run('match (n:Movie)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(n2:Movie) where n.title={titleMovie} return n2 as name order by n2.avgVote union match (n:Movie) where n.released={yearMovie} return n as name order by n.avgVote',{titleMovie:mostFrequentFilm,yearMovie:neo4j.int(mostFrequentYear)})
            .then(function (result){
                var movieArray2=[];
                result.records.forEach(function(record){
                    movieArray2.push({
                        id: record._fields[0].identity.low,
                        title:  record._fields[0].properties.title,
                        released: record._fields[0].properties.released,
                        overview: record._fields[0].properties.overview,
                        avgVote: record._fields[0].properties.avgVote,
                        image: record._fields[0].properties.image,
                    });
                });
                res.render('recommend', {
                    movies2: movieArray2,
                    film:film,
                });                             

            })
            .catch(function(err){
                console.log(err);
            });
        }else if(mostFrequentYear!=undefined && mostFrequentFilm!=undefined && mostFrequentGenre!=undefined){
            sessionNueva2
            .run('match (n:Movie)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(n2:Movie) where n.title={titleMovie} return n2 as name union match (n:Movie)-[:tieneGenero]->(g:Genero) where g.genero={generoMovie} AND n.released={yearMovie} return n as name',{yearMovie:neo4j.int(mostFrequentYear),titleMovie:mostFrequentFilm,generoMovie:mostFrequentGenre})
            .then(function (result){
                var movieArray2=[];
                result.records.forEach(function(record){
                    movieArray2.push({
                        id: record._fields[0].identity.low,
                        title:  record._fields[0].properties.title,
                        released: record._fields[0].properties.released,
                        overview: record._fields[0].properties.overview,
                        avgVote: record._fields[0].properties.avgVote,
                        image: record._fields[0].properties.image,
                    });
                });

                res.render('recommend', {
                    movies2: movieArray2,
                    film:film,
                });                             

            })
            .catch(function(err){
                console.log(err);
            });
        }else if(mostFrequentYear==undefined && mostFrequentFilm!=undefined && mostFrequentGenre==undefined){
            sessionNueva
            .run('MATCH (n:Movie) RETURN n limit 1')
            .then(function (result){
                res.render('indexAlert', {
                
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }else{
            sessionNueva
            .run('MATCH (n:Movie) RETURN n limit 1')
            .then(function (result){
                res.render('indexAlert', {
                
                });
            })
            .catch(function(err){
                console.log(err);
            });
        }
    }

});


//llevar al index de alerta cuando no hay suficiente data
app.post('/index',function(req, res){
    sessionNueva
        .run('MATCH (n:Movie) RETURN n limit 1')
        .then(function (result){
            res.render('indexAlert', {
            
            });
        })
        .catch(function(err){
            console.log(err);
        });
        
})


//Redirige a la página donde se muestran los actores
app.post('/actors/list', function(req,res){

    sessionNueva
        .run('MATCH (n:Actor) RETURN n')
        .then(function(result2){
            var actorArray= [];
            result2.records.forEach(function(record){
                actorArray.push({
                    id: record._fields[0].identity.low,
                    name:  record._fields[0].properties.nombre,
                    
                });
                                   
            });
            res.render('actors', {
                actors: actorArray,
            });             
        })
        .catch(function(err){
            console.log(err);
        });
})

//Redirige a la página donde se muestran los directores
app.post('/directors/list', function(req,res){

    sessionNueva
        .run('MATCH (n:Director) RETURN n')
        .then(function(result2){
            var directorArray= [];
            result2.records.forEach(function(record){
                directorArray.push({
                    id: record._fields[0].identity.low,
                    name:  record._fields[0].properties.nombre,
                    
                });
                                   
            });
            res.render('directors', {
                directors: directorArray,
            });             
        })
        .catch(function(err){
            console.log(err);
        });
})


//Redirige a la página donde se añade la película
app.post('/adding-movie',function(req, res){
    sessionNueva
        .run('MATCH (n:Movie) RETURN n limit 1')
        .then(function (result){
            res.render('addMovie', {
            });
        })
        .catch(function(err){
            console.log(err);
        });
})

//Redirige a la página donde se añade el actor
app.post('/adding-actor',function(req, res){
    sessionNueva
        .run('MATCH (n:Movie) RETURN n limit 1')
        .then(function (result){
            res.render('addActor', {
            });
        })
        .catch(function(err){
            console.log(err);
        });
})

//Redirige a la página donde se añade el director
app.post('/adding-director',function(req, res){
    sessionNueva
        .run('MATCH (n:Movie) RETURN n limit 1')
        .then(function (result){
            res.render('addDirector', {
            });
        })
        .catch(function(err){
            console.log(err);
        });
})


//Añade película
app.post('/movie/add',function(req, res){
    var title=req.body.titleMovie;
    var nameActor=req.body.nameActor;
    var nameDirector=req.body.nameDirector;
    var synopsisMovie=req.body.synopsisMovie;
    var released=req.body.releasedMovie;
    var genero=req.body.generoMovie;
    var avgVotestr=req.body.averageMovie;
    var image=req.body.url_image;

    console.log(genero)
    avgVote=parseFloat(avgVotestr);


    sessionNueva
        .run('MERGE (n:Movie {title:{titleParam}, overview:{overviewParam}, released:{releasedParam}, avgVote:$averageParam, image:{imageParam}}) MERGE (a:Actor {nombre:{nameAParam}}) MERGE (a)-[:ACTED_IN]-(n) MERGE (d:Director {nombre:{nameDParam}}) MERGE (d)-[:haDirigido]-(n) MERGE (g:Genero{genero:{generoParam}}) MERGE (n)-[:tieneGenero]-(g) return n,g,a,d', {titleParam:title, overviewParam: synopsisMovie, releasedParam:neo4j.int(released), nameAParam:nameActor, nameDParam:nameDirector, generoParam:genero, averageParam:avgVote, imageParam:image})
        
        .then(function (result){
            //res.redirect('/');
            //sessionNueva.close();
            res.render('addMovie',{
            });                                       
        })
        .catch(function(err){
            console.log(err);
        });

})

//Añade actor
app.post('/actor/add',function(req, res){
    var nameActor=req.body.actorName;
    console.log(nameActor);

    sessionNueva
        .run('MERGE (n:Actor{nombre:{nameParam}})', {nameParam:nameActor})
        
        .then(function (result){
            /* sessionNueva.close();  */
            res.render('addActor',{
            });                                       
        })
        .catch(function(err){
            console.log(err);
        });
});

//Añade director
app.post('/director/add',function(req, res){
    var nameDirector=req.body.directorName;
    console.log(nameDirector);

    sessionNueva
        .run('MERGE (n:Director{nombre:{nameParam}})', {nameParam:nameDirector})
        
        .then(function (result){
            /* sessionNueva.close();  */
            res.render('addDirector',{
            });                                       
        })
        .catch(function(err){
            console.log(err);
        });
});



app.listen(3000);
console.log('Server Started on Port 3000');


module.exports = app;
