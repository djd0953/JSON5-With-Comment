~ key값이 hex로 되어있을때 parse를 못한다는 점과 기존 open souce(npm) 'json5'는 주석이 있어도 무시하고 object화 시키지만 주석도 parse해서 사용하고 싶어서 수정함 ~

1.
    parse(text, reviver) : {
      val: object,
      commant: object,
      hexValueOfKey: object[]
    }
    
    text: type to JSON5
  
    reviver: npm json5 문서 참조


    val: parsed object
  
    commant: 주석
  
    hexValueOfKey: hex로 되어있던 Key값 (type, stype은 개인적으로 사용하기 위해 만듬)
  
    {type: number, stype: number, key: string}

2.
    stringify(object, option): string
    
    object: java script 형식의 object
  
    option: {comment: object와 mapping되는 object(object stringify 후 comment stringify), hexKeywords: hex로 만들 Key}
  
    {
      comment: object,
      hexKeywords: object[]
    }


- stringify 할때 key값이 number일 경우 hex로 변환함! (수정할 생각 없음)
- stringify 할때 option.hexKeywords에서 mapping되는 key name을 찾고 있으면 hex로 변환함
- stringify 할때 command를 안넣으면 일반 open source 'json5' stringify처럼 사용할 수는 있지만 open source가 더 효율적임
- parse 할때 \u0000이 있으면 그냥 무시해버림 (open source는 Syntex Error)
- parse에서 Key parsing 할때 0이후 char 'x'가 찍히면 알아서 Hex라고 생각하고 number로 바꿔서 return해줌 (open source는 Sytex Error)
- parse or stringify에서 계속 type, stype을 찾아서 무언가 하는건 개인적으로 사용 할 생각이여서 넣은 reference key이니 신경 안써도 
