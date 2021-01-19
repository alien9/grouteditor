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
  formats=[
    {id: "text", name: "Single line text"},
    {id: "textarea", name: "Paragraph text"},
    {id: "number", name: "Number"},
    {id: "color", name: "HTML Color"},
    {id: "tel", name: "Telephone number"},
    {id: "datetime", name: "Date / Time"},
    {id: "url", name: "Website URL"}
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
        this.set({"properties":{}});
      }
    }else{
      this.set({"properties":{}});
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
    this.referables=Object.keys(this.dict.properties).filter(key => this.dict.definitions[key].multiple).map(k => ({"key":k, "value":this.dict.definitions[k]}));
  }
  onclick(): void{
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
    if(o.required && (o.required.indexOf(oldkey)>=0)){
      o.required.splice(o.required.indexOf(oldkey),1);
      o.required.push(event.srcElement.value);
    }
    o.properties=h;
  }
  newTable(tablename): void{
    let propertyOrder: number=0;
    for(var j in this.dict.properties){
      if(j==tablename){
        var version=0;
        while(this.dict.properties[tablename]){
          version++;
          tablename=(tablename+"0").replace(/\d+$/,""+version);
        }
      }
      if(this.dict.properties[j].propertyOrder >= propertyOrder){
        propertyOrder=1+this.dict.properties[j].propertyOrder;
      }
    }

    var properties={};
    var definitions={};
    for(var k in this.dict.properties){
        properties[k]=this.dict.properties[k];
        definitions[k]=this.dict.definitions[k];
    }
    properties[tablename]={
            "$ref": "#/definitions/"+tablename,
            "options": {"collapsed": true},
            "propertyOrder": propertyOrder
    };
    definitions[tablename]={
            "type": "object",
            "title": "Insert title",
            "multiple": false,
            "details": false,
            "required": ["_localId"],
            "properties": {
              "_localId": {"type": "string", "options": {"hidden": true}, "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"},
            },
            "definitions": {},
            "description": "",
            "plural_title": "Plural title",
            "propertyOrder": propertyOrder
          };
    this.dict.definitions=definitions;
    this.dict.properties=properties;
    this.set(this.dict);
  }
  setMode(s, e): void{
    if(s=='tree'){
      if(e){
        var a=e.srcElement.parentNode.parentNode.getElementsByTagName('textarea')[0].value;
        try{
          this.set(JSON.parse(a));
        }catch(e){

        }
      }
    }
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
    for(var k in this.dict.properties){
      if(k==title){
        var version=0;
        while(this.dict.properties[title]){
          version++;
          title=(title+"0").replace(/\d+$/,""+version);
        }
      }
    }
    for(var k in this.dict.properties){
      if(k==model){
        h[title]=this.dict.properties[k];
        hc[title]=this.dict.definitions[k];
      }else{
        h[k]=this.dict.properties[k];
        hc[k]=this.dict.definitions[k];
      }
    }
    h[title]["items"]={
          "$ref": "#/definitions/"+title
        };
    h[title]["title"]=event.srcElement.value;
    this.dict.properties=h;
    this.dict.definitions=hc;
    let res={"properties":h,"definitions":hc};
    this.set(res);
  }
  newOption(f): void{
    if(f.enum)
      f.enum.push("New Option");
    if(f.items && f.items.enum)
      f.items.enum.push("New Option");
  }
  removeOption(f, o): void{
    if(f.enum)
      f.enum.splice(o,1);
    if(f.items && f.items.enum)
      f.items.enum.splice(o,1);
  }
  setPropertyValue(a, i, event): void{
    a[i]=event.srcElement.value;
  }
  deactivate():void {
    this.setActive(null);
  }
  setDisplayType(o, event){
    if(event.srcElement.value=='checkbox'){
      o.format='checkbox';
      delete o.displayType;
      if(!o.items)
        o.items=(o.enum)?{enum:o.enum}:{enum:[]};
      delete o.enum;
    }else{
      delete o.format;
      o.displayType='select';
      if(!o.enum)
        o.enum=(o.items && o.items.enum)?o.items.enum:[];
      delete o.items;
    }
    console.log(event.srcElement.value);
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
      o["displayType"]="select";
    }else{
      delete o["enum"];
      delete o["items"];
    }
  }
  contains(array, o){
    return array.includes(o);
  }
  setRequired(o, t, event){
    if(event.srcElement.checked){
      if(!this.dict.definitions[t].required.includes(o))
      this.dict.definitions[t].required.push(o);
    }else{
      for(var i=0;i<this.dict.definitions[t].required.length; i++){
        if(this.dict.definitions[t].required[i]==o)
          this.dict.definitions[t].required.splice(i,1);
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

      if(definition.required && (definition.required.indexOf(fieldname)>=0))
        definition.required.splice(definition.required.indexOf(fieldname),1);

    }
  }
  deleteObject(o){
    if(!confirm("Delete "+o.key+ " permanently?")) 
      return;
    let res={"properties":{},"definitions":{}};
    for(let key in this.dict.properties){
      if(key!=o.key){
        res.properties[key]=this.dict.properties[key];
        res.definitions[key]=this.dict.definitions[key];
      }
    }
    this.set(res);
  }
  setPluralTitle(t, event){
    t.plural_title=event.srcElement.value;
  }
  setReferables(event: Event){
    this.referables=Object.keys(this.dict.properties).filter(key => this.dict.definitions[key].multiple).map(k => ({"key":k, "value":this.dict.definitions[k]}));
    for(let key in this.dict.properties){
      if(!this.dict.definitions[key].multiple){
        delete(this.dict.properties[key].items);
        this.dict.properties[key]["$ref"]="#/definitions/"+key;
        delete this.dict.properties[key].type;
      }else{
        delete(this.dict.properties[key]["$ref"]);
        this.dict.properties[key].items={"$ref":"#/definitions/"+key};
        this.dict.properties[key].type="array";
      }
    }
    this.set(JSON.parse(JSON.stringify(this.dict)));
  }
  hasFormat(name: string){
    return (name=="text");
  }
}
