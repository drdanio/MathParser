# MathParser
Parser for string writed formulas (can be extended)
Writed on python and javascript with same functional

based on code ideas in https://habr.com/ru/post/273253/
but can work with: 
    word operators (not only symbol operators as original) e.g. min, max, abs and other...
    can propertly work with sub zero values and parameters
    
parsing based on dynamic regex

how to use:
- python: (need MathParser.py file in project)
```python
    from MathParser import MathParser
    
    m=MathParser()
    formula="min((-250+i+1+i),315,214,121)"
    params={"i":"49"}
    result=m.calc(formula,params)
```
- javascrtip: (need MathParser.js imported to project)
```javascript
    var m=new MathParser();
    var formula="min((-250+i+1+i),315,214,121)"
    var params={"i":"49"}
    var result=m.calc(formula,params)
```
