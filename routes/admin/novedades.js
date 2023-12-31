var express = require('express');
var router = express.Router();
var novedadesModel = require('../../models/novedadesModel')

var util = require('util');
var cloudinary = require('cloudinary').v2;
const uploader =util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

/*listar novedades*/
router.get('/', async function(req, res, next) {
    var novedades= await novedadesModel.getNovedades();

    novedades = novedades.map(novedad => {
        if (novedad.img_id){
            const imagen = cloudinary.image(novedad.img_id, {
                width:80,
                height: 80,
                crop: 'fill'
            });
            return{
                ...novedad, //tit sub cuerpo
                imagen //imagen
            }
        }else{
            return{
                ...novedad, //tit sub cuerpo
                imagen: '' //nada
            }
        }
    });

    res.render('admin/novedades',{
        layout:'admin/layout',
        persona:req.session.nombre, novedades

    });
  });

  /*Para eliminar una novedad*/
  router.get('/eliminar/:id', async(req, res, next) =>{
    const id =req.params.id;

    let novedad = await novedadesModel.getNovedadById(id);
    if (novedad.img_id) {
        await (destroy(novedad.img_id));
    }
    await novedadesModel.deleteNovedadById(id);
    res.redirect('/admin/novedades')
  }) //cierra get de eliminar

router.get('/agregar', (req, res, next)=> {
    res.render('admin/agregar',{ //agregrar.hbs (dentro del admin)
        layout: 'admin/layout'
    }); //cierra render
}); //cierra Get

router.post('/agregar', async (req, res, next) =>{
    try{
        var img_id = '';
        if (req.files && Object.keys(req.files).length > 0){
            imagen = req.files.imagen;
            img_id = (await uploader(imagen.tempFilePath)).public_id;
        }

        //console.log(req.body)
        if(req.body.titulo !="" && req.body.subtitulo !="" &&
        req.body.cuerpo !=""){
            await novedadesModel.insertNovedad({
                ...req.body, //spread titulo, sub y cuerpo
                img_id
            });
            res.redirect('/admin/novedades')
        } else{
            res.render('admin/agregar',{
                layout: 'admin/layout',
                error:true, message:'Todos los campos son requeridos'
            })
        }
    } catch (error){
        console.log(error)
        res.render('admin/agregar',{
            layout: 'admin/layout',
            error:true, message: 'No se cargó la novedad'
        });
    }
});

router.get('/modificar/:id', async (req, res, next)=>{
    var id = req.params.id;
    var novedad = await novedadesModel.getNovedadById(id);

    res.render('admin/modificar',{
        layout:'admin/layout', novedad
    })
})

/*metodo post- info que viene desde el formulario*/
router.post('/modificar', async (req, res, next) => {
    try{
        let img_id = req.body.img_original;
        let borrar_img_vieja = false;
        if (req.body.img_delete === "1"){
            img_id=null;
            borrar_img_vieja = true;
        } else {
            if(req.files && Object.keys(req.files).length > 0) {
                imagen = req.files.imagen;
                img_id = (await uploader(imagen.tempFilePath)).public_id;
                borrar_img_vieja = true;
            }
        }
        if (borrar_img_vieja && req.body.img_original){
            await (destroy(req.body.img_original));
        }

        var obj = {
            titulo:req.body.titulo,
            subtitulo:req.body.subtitulo,
            cuerpo: req.body.cuerpo,
            img_id
}
await novedadesModel.modificarNovedadById(obj, req.body.id);
res.redirect('/admin/novedades');
    }
    catch(error){
        console.log(error)
        res.render('admin/modificar',{
            layout:'admin/layout',
            error:this.true, message: 'No se modificó la novedad'
        })
    }
});
/* cierra post*/
  module.exports = router;