class MathParser {
				
	constructor() {
		//this class not use eval
	}

	/*
	this.OPERATORS can be extended for new operators.
	example:
		'count': {"Priority":5, "fn":self._count}
		where:
			'count'			- operator word in formula
			"Priority":5 		- priority for calc (bigger: first)
			"fn":self._count 	- link to function or arrow function
	*/
	
	OPERATORS = {
		',': {"Priority":1,"fn":this._append}, 
		'+': {"Priority":2,"fn":this._add}, 
		'-': {"Priority":2,"fn":this._subtract}, 
		'*': {"Priority":3,"fn":this._multiply}, 
		'/': {"Priority":3,"fn":this._divide},
		'^': {"Priority":4,"fn":this._power}, 
		'min': {"Priority":5,"fn":this._min}, 
		'max': {"Priority":5,"fn":this._max},
		'abs': {"Priority":5,"fn":this._abs},
		'summ': {"Priority":5,"fn":this._summ},
		'count': {"Priority":5,"fn":this._count},
	}

	_toArray(x) {
		if (!Array.isArray(x)) { return [x] }
		return x;
	}
	_add(x,y) { return x + y }
	_subtract(x,y) { return x - y }
	_append(x,y) { return this._toArray(x).concat(this._toArray(y)) }
	_multiply(x,y) { return x * y }
	_divide(x,y) { return x / y }
	_power(x,y) { return x ^ y }
	_max(x) { return Math.max(...this._toArray(x)) }
	_min(x) { return Math.min(...this._toArray(x)) }
	_abs(x) { return Math.abs(x) }
	_summ(x) {
		var res=0;
		for (var i=0; i<this._toArray(x).length; i++) { res+=a }	
		return res;
	}
	_count(x) { return this._toArray(x).length }

	_re_sort(arr) {
		arr=arr.sort(); //Sort By Name asc
		return arr.sort(function(a, b){return b.length-a.length}); //Sort By Length desc
	}

	_re_escape(arr) {
		for (var i=0; i<arr.length; i++) {
			arr[i]=arr[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); //Escape Regexp symbols
		}
		return arr;
	}

	_isFloat(s) { return !Number.isNaN(Number.parseFloat(s)); }

	* _parse(formula_string,params) {
		/*
		parsing string formula function
			formula_string	- string with formula (e.g. "min((x*(abs(y)/100)),24)+3" )
			params		- named array with parameters: (e.g. {"x":"20", "y":"102"})
		returns generator array splitted by operands with replaced params (e.g. ["min","(","(",20,"*","(","abs","(",102,")","/",100,")",")",",",24,")","+",3])
		*/
		console.log(formula_string,params);
		var s=formula_string.trim().replace(" ","");
		var keys=this._re_escape(Object.keys(this.OPERATORS)).concat(this._re_escape(Object.keys(params)));
		keys=this._re_sort(keys);
		var re=new RegExp(keys.join("|")+"|[\)\(]|[0-9\.]+",'ig'); //Create Regexp
		console.log(re);
		var o=s.match(re);
		if ((o==null) || (o.join("")!=s) ) { throw new Error('formula Error:',{'formula':s, 'parsed':o, 'regex':re}); }
		for (var i=0; i<o.length; i++ ) {
			var x=o[i];
			if ((x in this.OPERATORS) || (x.match(/^[\)\(]$/)) ) { yield x }
			else if (this._isFloat(x)) { yield Number.parseFloat(x) }
			else if (x in params) {
				var y=params[x];
				if (Array.isArray(y)) { yield y }
				else if (this._isFloat(y)) { yield Number.parseFloat(y) }
				else { throw new Error('param is not array or number',{'operator':x, 'value':y}) }
			}
			else { throw new Error('cannot determine operator',{'operator':x}); }
		}
	}

	* _shunting_yard(parsed_formula) {
		/* function for make reverse polish representation of formula array with sort by operator priority */
		var stack = [];
		var el=parsed_formula.next();
		while (!el.done) {
			var token=el.value;
			if (Array.isArray(token)) { yield token }
			else if (token in this.OPERATORS) {
				while ( ( stack.length > 0) && (stack[stack.length-1] != "(") && (this.OPERATORS[token]["Priority"] <= this.OPERATORS[stack[stack.length-1]]["Priority"])  ) { yield stack.pop() }
				stack.push(token);
			}
			else if (token == ")") {
				while ( stack.length > 0) {
					var x = stack.pop();
					if (x == "(") { break; }
					yield x;
				}
			}
			else if (token == "(") { stack.push(token); }
			else { yield token }
			el=parsed_formula.next();
		}
		while ( stack.length > 0) { yield stack.pop() }
	}

	_calc(polish) {
		/* calculating function */
		var stack = []
		var el=polish.next();
		while (!el.done) {
			var token=el.value;
			el=polish.next();
			if (Array.isArray(token)) { stack.push(token) }
			else if (token in this.OPERATORS) {
				var x=[];
				var count=this.OPERATORS[token]["fn"].length;
				if (count>stack.length) {
					if ((token == "-") && (stack.length==1)) { //Special case for sub zero values
						stack.push(stack.pop()*(-1)); 
						continue;
					}
					else { throw new Error('Operator ('+token+') has no attributes',{"Operator":token,"RequestAttrCount":count,"RealAttrCount":stack.length,"Stack":stack}) }
				}
				for (var j=0; j<count; j++) { x.push(stack.pop()) }
				x=x.reverse();
				stack.push(this.OPERATORS[token]["fn"].apply(this,x));
			}
			else { stack.push(token) }
		}
		return stack[0];
	}


	calc(formula,params={},silent=false) {
		/*
		main calc function:
			formula	- string with formula (e.g. "min((x*(abs(y)/100)),24)+3" )
			params	- named array with parameters: (e.g. {"x":"20", "y":"102"})
			silent	- if true - works without exceptions, but if calc error - returns null
		returns calculated value
		*/
		var res=null;
		if (silent) {
			try { res=this._calc(this._shunting_yard(this._parse(formula,params))) }
			catch (error) { console.log(error) }
		}
		else { res=this._calc(this._shunting_yard(this._parse(formula,params))) }
		return res;
	}
}
