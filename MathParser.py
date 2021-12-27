import re

class MathParser:
	"""
		this class not use eval
	"""
	def __init__(self) -> None:
		"""
		self.OPERATORS can be extended for new operators.
		example:
			'count': {"Priority":5, "fn":self._count}
			where:
				'count'				- operator word in formula
				"Priority":5 		- priority for calc (bigger: first)
				"fn":self._count 	- link to function or arrow function
		"""
		self.OPERATORS = {
			',': {"Priority":1, "fn":self._append}, 
			'+': {"Priority":2, "fn":self._add}, 
			'-': {"Priority":2, "fn":self._subtract}, 
            '*': {"Priority":3, "fn":self._multiply}, 
			'/': {"Priority":3, "fn":self._divide}, 
			'^': {"Priority":4, "fn":self._power}, 
			'min': {"Priority":5, "fn":self._min}, 
			'max': {"Priority":5, "fn":self._max}, 
			'abs': {"Priority":5, "fn":self._abs}, 
			'summ': {"Priority":5, "fn":self._summ}, 
			'count': {"Priority":5, "fn":self._count}
		}

	def _add(self,x,y):
		return x + y

	def _subtract(self,x,y):
		return x - y

	def _append(self,x,y):
		return self._toArray(x)+self._toArray(y)

	def _multiply(self,x,y):
		return x * y

	def _divide(self,x,y):
		return x / y

	def _power(self,x,y):
		return x ^ y

	def _max(self,x):
		return max(self._toArray(x))

	def _min(self,x):
		return min(self._toArray(x))

	def _abs(self,x):
		return abs(x)

	def _summ(self,x):
		res=0
		for a in self._toArray(x):
			res+=a
		return res

	def _count(self,x):
		return len(self._toArray(x))

	def _toArray (self,x):
		if not (type(x) is list):
			return [x]
		return x

	def _is_float(self,x) -> bool:
		try:
			float(x)
			return True
		except ValueError:
			return False

	def _parse(self,formula_string,params):
		"""
			parsing string formula function
				formula_string	- string with formula (e.g. "min((x*(abs(y)/100)),24)+3" )
				params			- named array with parameters: (e.g. {"x":"20", "y":"102"})
			returns generator list splitted by operands with replaced params (e.g. ["min","(","(",20,"*","(","abs","(",102,")","/",100,")",")",",",24,")","+",3])
		"""
		s=formula_string.strip().replace(" ","")
		keys=list(self.OPERATORS.keys())+list(params.keys())
		keys.sort()
		keys.sort(key=len,reverse=True)
		for i in range(len(keys)):
			keys[i]=re.escape(keys[i])
		keys=re.compile("|".join(keys)+"|[\)\(]|[0-9\.]+", flags=re.IGNORECASE)
		o=keys.findall(s)
		if ((o is None) or ("".join(o) != s)):
			raise Exception('formula Error:',{'formula':s, 'parsed':o, 're':keys})
		operators=list(self.OPERATORS.keys())+["(",")"]
		for x in o:
			if x in operators:
				yield x
			elif self._is_float(x):
				yield float(x)
			elif x in params:
				y=params[x]
				if type(y) is list:
					yield y
				elif self._is_float(y):
					yield float(y)
				else:
					raise Exception('param is not array or number',{'operator':x, 'value':y})
			else:
				raise Exception('cannot determine operator',{'operator':x})

	def _shunting_yard(self,parsed_formula):
		"""
			function for make reverse polish representation of formula array with sort by operator priority
		"""
		stack = []
		for token in parsed_formula:
			if type(token) is list:
				yield token
			elif token in self.OPERATORS:
				while stack and stack[-1] != "(" and self.OPERATORS[token]["Priority"] <= self.OPERATORS[stack[-1]]["Priority"]:
					yield stack.pop()
				stack.append(token)
			elif token == ")":
				while stack:
					x = stack.pop()
					if x == "(":
						break
					yield x
			elif token == "(":
				stack.append(token)
			else:
				yield token
		while stack:
			yield stack.pop()

	def _calc(self,polish):
		"""
			calculating function
		"""
		stack = []
		for token in polish:
			if type(token) is list:
				stack.append(token)
			elif token in self.OPERATORS:
				x=[]
				count=self.OPERATORS[token]["fn"].__code__.co_argcount-1
				if count>len(stack):
					if ((token == "-") and (len(stack)==1)): # special case for sub zero values
						stack.append(stack.pop()*(-1))
						continue
					else:
						raise Exception('Operator ('+token+') has no attributes',{"Operator":token,"RequestAttrCount":count,"RealAttrCount":len(stack),"Stack":stack})
				for i in range(count):
					x.append(stack.pop())
				x.reverse()
				stack.append(self.OPERATORS[token]["fn"](*x))
			else:
				stack.append(token)
		return stack[0]

	def calc (self,formula,params={},silent=False):
		"""
			main calc function:
				formula	- string with formula (e.g. "min((x*(abs(y)/100)),24)+3" )
				params	- named array with parameters: (e.g. {"x":"20", "y":"102"})
				silent	- if true - works without exceptions, but if calc error - returns None
			returns calculated value
		"""
		if silent:
			try:
				res=self._calc(self._shunting_yard(self._parse(formula,params)))
			except Exception as e:
				res=None
		else:
			res=self._calc(self._shunting_yard(self._parse(formula,params)))
		return res
