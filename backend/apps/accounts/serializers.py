from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["perfil"] = user.perfil
        token["nome"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["perfil"] = self.user.perfil
        data["nome"] = self.user.get_full_name() or self.user.username
        data["user_id"] = self.user.id
        data["username"] = self.user.username
        data["email"] = self.user.email
        return data


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    nome_completo = serializers.SerializerMethodField()

    def get_nome_completo(self, obj):
        return obj.get_full_name() or obj.username

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "nome_completo",
            "perfil", "supervisor_ref", "coordenador_ref", "vendedor_ref",
            "is_active", "password",
        ]
        read_only_fields = ["id"]

    def validate_perfil(self, value):
        request = self.context.get("request")
        if value == "dev" and request and not request.user.is_dev():
            raise serializers.ValidationError("Somente o Desenvolvedor pode criar usuários Admin.")
        return value

    def validate(self, attrs):
        perfil = attrs.get("perfil", getattr(self.instance, "perfil", None))
        supervisor_ref = attrs.get("supervisor_ref", getattr(self.instance, "supervisor_ref", None))
        coordenador_ref = attrs.get("coordenador_ref", getattr(self.instance, "coordenador_ref", None))

        errors = {}
        if perfil == "supervisor" and not supervisor_ref:
            errors["supervisor_ref"] = "Usuario supervisor deve estar vinculado a um supervisor."

        if perfil == "coordenador":
            if not coordenador_ref:
                errors["coordenador_ref"] = "Usuario coordenador deve estar vinculado a um coordenador."
            elif not coordenador_ref.supervisor_id:
                errors["coordenador_ref"] = "O coordenador selecionado nao esta vinculado a um supervisor."

        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        request = self.context.get("request")
        if "perfil" in validated_data and validated_data["perfil"] == "dev":
            if request and not request.user.is_dev():
                raise serializers.ValidationError({"perfil": "Somente o Desenvolvedor pode atribuir perfil Admin."})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
