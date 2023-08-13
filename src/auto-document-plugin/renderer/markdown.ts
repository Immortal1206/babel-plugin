import type { ClassInfo, FunctionInfo, Info } from '../types'

export default function (docs: Info) {
  let str = '';

  docs.forEach(doc => {
    if (doc.type === 'function') {
      str += '##' + doc.name + '\n';
      str += doc.doc?.description + '\n';
      if (doc.doc?.tags) {
        doc.doc.tags.forEach(tag => {
          str += tag.name + ': ' + tag.description + '\n';
        })
      }
      str += '>' + doc.name + '(';
      if ((doc as FunctionInfo).params) {
        str += (doc as FunctionInfo).params?.map(param => {
          return param.name + ': ' + param.type;
        }).join(', ');
      }
      str += ')\n';
      str += '#### Parameters:\n';
      if ((doc as FunctionInfo).params) {
        str += (doc as FunctionInfo).params?.map(param => {
          return '-' + param.name + '(' + param.type + ')';
        }).join('\n');
      }
      str += '\n'
    } else if (doc.type === 'class') {
      str += '##' + doc.name + '\n';
      str += doc.doc?.description + '\n';
      if (doc.doc?.tags) {
        doc.doc.tags.forEach(tag => {
          str += tag.name + ': ' + tag.description + '\n';
        })
      }
      str += '> new ' + doc.name + '(';
      if ((doc as FunctionInfo).params) {
        str += (doc as FunctionInfo).params?.map(param => {
          return param.name + ': ' + param.type;
        }).join(', ');
      }
      str += ')\n';
      str += '#### Properties:\n';
      if ((doc as ClassInfo).propertiesInfo) {
        (doc as ClassInfo).propertiesInfo.forEach(param => {
          str += '-' + param.name + ':' + param.type + '\n';
        });
      }
      str += '#### Methods:\n';
      if ((doc as ClassInfo).methodsInfo) {
        (doc as ClassInfo).methodsInfo.forEach(param => {
          str += '-' + param.name + '\n';
        });
      }
      str += '\n'
    }
    str += '\n'
  })
  return str;
}