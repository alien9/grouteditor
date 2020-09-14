import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import isEqual from 'lodash.isequal';

@Component({
  selector: 'app-jsoneditor',
  inputs: ['textarea'],
  templateUrl: './jsoneditor.component.html',
  styleUrls: ['./jsoneditor.component.css']
})
export class JSONEditorComponent implements OnInit {
  textarea: string;
  field_name: string="json-content";
  value = '';
  dict: any;
  referables: any;
  teste: string;
  mode = 'tree';
  subtypes=[];
  active: any;
  activeKey: any;
  code: boolean = false;
  fieldtypes=[
    {id:'text', name:'text'},
    {id:'integer', name:'integer'},
    {id:'selectlist', name:'selectlist'},
    {id:'reference', name:'reference'},
  ]


  constructor(private elementRef:ElementRef) {
        this.textarea = this.elementRef.nativeElement.getAttribute('textarea_id');
        this.field_name = this.elementRef.nativeElement.getAttribute('textarea_name');
  }

  ngOnInit(): void {
    if(this.textarea){
      try{
        this.set(JSON.parse((<HTMLInputElement>window.document.getElementById(this.textarea)).value));
      }catch(e){
        this.set({"schema":{"properties":{}}});
      }
    }else{
      this.set({"schema":{"properties":{}}});
    }
  }
  load(event):void{
    try{
      this.set(JSON.parse(event.srcElement.value));
    }catch(e){
      this.dict={};
    }
  }
  set(v): void{
    this.dict=v;
    this.value=JSON.stringify(this.dict);
    this.referables=Object.keys(this.dict.schema.properties).filter(key => this.dict.schema.definitions[key].multiple).map(k => ({"key":k, "value":this.dict.schema.definitions[k]}));
  }
  onclick(): void{
    alert(this.teste);
    this.value=JSON.stringify(this.dict);
  }
  compareByOptionId(idFist, idSecond): boolean{
    return idFist && idSecond && idFist == idSecond;
  }
  setActive(x, key=null): void{
    this.active=x;
    if(key!==null){
      this.activeKey=key;
    }else{
      this.activeKey=null;
    }
  }
  isActive(x, key=null): boolean{
    if(key!==null){
      return isEqual(this.active,x) && (key==this.activeKey);
    }
    return isEqual(this.active,x);
  }
  renamekey(o, oldkey, event): void{
    var h={};
    for(var k in o.properties){
      if(isEqual(event.srcElement.value, k)){
        this.setActive(null);
        return;
      }
      if(k==oldkey){
        h[event.srcElement.value]=o.properties[k];
      }else{
        h[k]=o.properties[k];
      }
    }
    o.properties=h;
  }
  newTable(tablename): void{
    let propertyOrder: number=0;
    for(var j in this.dict.schema.properties){
      if(j==tablename){
        var version=0;
        while(this.dict.schema.properties[tablename]){
          version++;
          tablename=(tablename+"0").replace(/\d+$/,""+version);
        }
      }
      if(this.dict.schema.properties[j].propertyOrder >= propertyOrder){
        propertyOrder=1+this.dict.schema.properties[j].propertyOrder;
      }
    }

    var properties={};
    var definitions={};
    for(var k in this.dict.schema.properties){
        properties[k]=this.dict.schema.properties[k];
        definitions[k]=this.dict.schema.definitions[k];
    }
    properties[tablename]={
            "type": "array",
            "items": {"$ref": "#/definitions/"+tablename},
            "title": "Insert title",
            "options": {"collapsed": true},
            "plural_title":"Plural title",
            "propertyOrder": propertyOrder
    };
    definitions[tablename]={
            "type": "object",
            "title": "Insert title",
            "multiple": false,
            "required": ["_localId"],
            "properties": {
              "_localId": {"type": "string", "options": {"hidden": true}, "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"},
            },
            "definitions": {},
            "description": "",
            "plural_title": "Plural title",
            "propertyOrder": propertyOrder
          };
    this.dict.schema.definitions=definitions;
    this.dict.schema.properties=properties;
    this.set(this.dict);
  }
  setMode(s): void{
    this.mode=s;
  }
  renameModel(model, event):void {
    let title=event.srcElement.value;
    if(title==model)
      return;
    title=title.normalize("NFD").replace(/[\u0300-\u036f]|\s/g, "");
    title = 'driver' + title[0].toUpperCase() + title.slice(1);
    let h={};
    let hc={};
    for(var k in this.dict.schema.properties){
      if(k==title){
        var version=0;
        while(this.dict.schema.properties[title]){
          version++;
          title=(title+"0").replace(/\d+$/,""+version);
        }
      }
    }
    for(var k in this.dict.schema.properties){
      if(k==model){
        h[title]=this.dict.schema.properties[k];
        hc[title]=this.dict.schema.definitions[k];
      }else{
        h[k]=this.dict.schema.properties[k];
        hc[k]=this.dict.schema.definitions[k];
      }
    }
    h[title]["items"]={
          "$ref": "#/definitions/"+title
        };
    h[title]["title"]=event.srcElement.value;
    this.dict.schema.properties=h;
    this.dict.schema.definitions=hc;
    let res={"properties":h,"definitions":hc};
    this.set({"schema":res});
  }
  newOption(f): void{
    f.enum.push("New Option");
  }
  removeOption(f, o): void{
     f.enum.splice(o,1);
  }
  setPropertyValue(a, i, event): void{
    a[i]=event.srcElement.value;
  }
  deactivate():void {
    this.setActive(null);
  }
  setTarget(o,event){
    if(event=="reference"){
      o["watch"]={"target": null};
      o["enumSource"]=[
              {
                "title": "",
                "value": "{{item._localId}}",
                "source": "target"
              }
            ];
    }else{
      delete o["watch"];
      delete o["enumSource"];
    }
    if(event=="selectlist"){
      o["enum"]=[];
    }else{
      delete o["enum"];
    }
  }
  contains(array, o){
    return array.includes(o);
  }
  setRequired(array, o, event){
    if(event.srcElement.checked){
      if(!array.includes(o))
        array.push(o);
    }else{
      for(var i=0;i<array.length; i++){
        if(array[i]==o)
          array.splice(i,1);
      }
    }
  }
  newField(definition):void {
    let h={};
    let propertyOrder=0;
    for(let i in definition.properties){
      if(propertyOrder<=definition.properties[i].propertyOrder){
        propertyOrder=definition.properties[i].propertyOrder+1;
      }
      h[i]=definition.properties[i];
    }
    h["New property"]={
      "type": "string",
      "fieldType": "text",
      "isSearchable": false,
      "propertyOrder": propertyOrder
    };
    definition.properties=h;
  }
  deleteField(definition, fieldname){
    if(confirm("Delete "+fieldname+"?")){
      let h={};
      for(let i in definition.properties){
        if(i!=fieldname){
          h[i]=definition.properties[i];
        }
      }
      definition.properties=h;
    }
  }
  deleteObject(o){
    if(!confirm("Delete "+o.key+ " permanently?")) 
      return;
    let res={"properties":{},"definitions":{}};
    for(let key in this.dict.schema.properties){
      if(key!=o.key){
        res.properties[key]=this.dict.schema.properties[key];
        res.definitions[key]=this.dict.schema.definitions[key];
      }
    }
    this.set({"schema":res});
  }
  setPluralTitle(t, event){
    t.plural_title=event.srcElement.value;
  }
  setReferables(event){
    this.referables=Object.keys(this.dict.schema.properties).filter(key => this.dict.schema.definitions[key].multiple).map(k => ({"key":k, "value":this.dict.schema.definitions[k]}));
  }
}
