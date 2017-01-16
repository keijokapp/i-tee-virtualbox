export function asyncMiddleware(handler) {
	return function() {
		const next = arguments.length === 4 ? arguments[3] : arguments[2];
		const res = arguments.length === 4 ? arguments[2] : arguments[1];

		handler.apply(this, [].slice.call(arguments, 0, arguments.length - 1))
			.then(() => {
				if(!res.finished) next();
			})
			.catch(e => {
				if(!res.finished) next(e);
			})
	}
}

